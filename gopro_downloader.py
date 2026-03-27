#!/usr/bin/env python3
"""
GoPro Cloud Video Downloader
-----------------------------
Downloads media from GoPro cloud storage (GoPro Plus / GoPro Media Library).

Authentication options:
  1. Bearer token (recommended) — extract from browser after logging in at
     https://plus.gopro.com/media-library/
     Open DevTools → Application → Cookies → copy value of `gp_access_token`

  2. Username/password + OAuth2 credentials (requires client_id and
     client_secret extracted from a GoPro app — not publicly available from
     GoPro; source them from community projects like itsankoff/gopro-plus).

NOTE: GoPro does not publish an official cloud API. This tool uses reverse-
engineered endpoints that may change without notice.

Usage examples:
  # Download all videos using a browser token
  python gopro_downloader.py --token YOUR_TOKEN --output ./downloads

  # Filter to only 4K videos, dry-run first
  python gopro_downloader.py --token YOUR_TOKEN --type Video --dry-run

  # Authenticate with credentials (requires client_id + client_secret)
  python gopro_downloader.py \\
      --username you@example.com --password yourpass \\
      --client-id CLIENT_ID --client-secret CLIENT_SECRET \\
      --output ./downloads
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Iterator, Optional

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests tqdm")

try:
    from tqdm import tqdm
except ImportError:
    sys.exit("Missing dependency: pip install requests tqdm")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

API_BASE = "https://api.gopro.com"
TOKEN_URL = f"{API_BASE}/v1/oauth2/token"
SEARCH_URL = f"{API_BASE}/media/search"
DOWNLOAD_URL = f"{API_BASE}/media/{{media_id}}/download"

MEDIA_ACCEPT_HEADER = "application/vnd.gopro.jk.media+json; version=2.0.0"

SEARCH_FIELDS = (
    "captured_at,content_title,content_type,created_at,file_size,id,"
    "filename,file_extension,type,resolution,width,height,camera_model,"
    "ready_to_view,ready_to_edit,source_duration,token"
)

# Seconds to wait between page requests (be polite to the undocumented API)
PAGE_REQUEST_DELAY = 0.5

# Retry configuration for network errors
MAX_RETRIES = 4
RETRY_BACKOFF_BASE = 2  # seconds


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def authenticate_with_credentials(
    username: str,
    password: str,
    client_id: str,
    client_secret: str,
) -> str:
    """Obtain an access token via the OAuth2 ROPC flow."""
    payload = {
        "grant_type": "password",
        "client_id": client_id,
        "client_secret": client_secret,
        "username": username,
        "password": password,
        "scope": "root root:channels public me upload media_library_beta live",
    }
    response = _post_with_retry(TOKEN_URL, json=payload)
    response.raise_for_status()
    data = response.json()
    token = data.get("access_token")
    if not token:
        sys.exit(f"Authentication failed — no access_token in response: {data}")
    print("[auth] Obtained access token via OAuth2.")
    return token


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------


def _build_session(token: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "Authorization": f"Bearer {token}",
            "Accept": MEDIA_ACCEPT_HEADER,
            "Content-Type": "application/json",
        }
    )
    return session


def _get_with_retry(
    session: requests.Session, url: str, **kwargs
) -> requests.Response:
    """GET with exponential-backoff retries on network/5xx errors."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = session.get(url, **kwargs)
            if response.status_code < 500:
                return response
            # 5xx — retry
            print(
                f"  [warn] Server error {response.status_code} on attempt "
                f"{attempt + 1}/{MAX_RETRIES + 1}"
            )
        except requests.ConnectionError as exc:
            print(f"  [warn] Connection error on attempt {attempt + 1}: {exc}")
        if attempt < MAX_RETRIES:
            wait = RETRY_BACKOFF_BASE ** (attempt + 1)
            time.sleep(wait)
    response.raise_for_status()
    return response  # unreachable but satisfies type checkers


def _post_with_retry(url: str, **kwargs) -> requests.Response:
    """POST with exponential-backoff retries (unauthenticated, for token endpoint)."""
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = requests.post(url, **kwargs)
            if response.status_code < 500:
                return response
        except requests.ConnectionError as exc:
            print(f"  [warn] Connection error on attempt {attempt + 1}: {exc}")
        if attempt < MAX_RETRIES:
            time.sleep(RETRY_BACKOFF_BASE ** (attempt + 1))
    response.raise_for_status()
    return response


# ---------------------------------------------------------------------------
# Media listing
# ---------------------------------------------------------------------------


def iter_media_pages(
    session: requests.Session,
    media_type: Optional[str],
    per_page: int = 100,
) -> Iterator[list]:
    """Yield lists of media items, one page at a time."""
    page = 1
    total_pages = None

    while True:
        params: dict = {
            "fields": SEARCH_FIELDS,
            "order_by": "captured_at",
            "per_page": per_page,
            "page": page,
        }
        if media_type:
            params["type"] = media_type

        response = _get_with_retry(session, SEARCH_URL, params=params)
        if response.status_code == 401:
            sys.exit(
                "[error] 401 Unauthorized — your token is expired or invalid.\n"
                "Re-extract the `gp_access_token` cookie from your browser."
            )
        response.raise_for_status()

        data = response.json()
        items = data.get("_embedded", {}).get("media", [])
        pages_info = data.get("_pages", {})

        if total_pages is None:
            total_pages = pages_info.get("total_pages", 1)
            total_items = pages_info.get("total_items", "?")
            print(
                f"[info] Found {total_items} media item(s) across "
                f"{total_pages} page(s)."
            )

        yield items

        if page >= total_pages:
            break

        page += 1
        time.sleep(PAGE_REQUEST_DELAY)


def collect_all_media(
    session: requests.Session,
    media_type: Optional[str],
    per_page: int = 100,
) -> list:
    """Return a flat list of all media items."""
    all_items = []
    for page_items in iter_media_pages(session, media_type, per_page):
        all_items.extend(page_items)
    return all_items


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------


def get_download_url(session: requests.Session, media_id: str) -> Optional[str]:
    """Fetch the source-quality pre-signed download URL for a media item."""
    url = DOWNLOAD_URL.format(media_id=media_id)
    response = _get_with_retry(session, url)
    if response.status_code == 404:
        return None
    response.raise_for_status()

    data = response.json()
    embedded = data.get("_embedded", {})

    # Prefer the "source" variation for original quality
    for variation in embedded.get("variations", []):
        if variation.get("label") == "source":
            return variation.get("url")

    # Fall back to the first file URL
    files = embedded.get("files", [])
    if files:
        return files[0].get("url")

    return None


def download_file(url: str, dest_path: Path, file_size: Optional[int]) -> None:
    """Stream-download a pre-signed URL to dest_path with a progress bar."""
    with requests.get(url, stream=True, timeout=300) as response:
        response.raise_for_status()
        content_length = int(response.headers.get("content-length", file_size or 0))
        with (
            open(dest_path, "wb") as fh,
            tqdm(
                total=content_length or None,
                unit="B",
                unit_scale=True,
                unit_divisor=1024,
                desc=dest_path.name,
                leave=False,
            ) as bar,
        ):
            for chunk in response.iter_content(chunk_size=1024 * 256):
                fh.write(chunk)
                bar.update(len(chunk))


def download_media_item(
    session: requests.Session,
    item: dict,
    output_dir: Path,
    dry_run: bool,
) -> bool:
    """
    Download a single media item.
    Returns True if downloaded (or would be in dry-run), False if skipped.
    """
    media_id = item.get("id", "unknown")
    filename = item.get("filename") or f"{media_id}.bin"
    file_size = item.get("file_size")
    captured_at = item.get("captured_at", "")[:10]  # YYYY-MM-DD

    dest_path = output_dir / filename

    if dest_path.exists():
        # Skip if size matches (basic resume/dedup check)
        if file_size and dest_path.stat().st_size == file_size:
            print(f"  [skip] {filename} (already downloaded)")
            return False
        # Partial file — resume by re-downloading
        print(f"  [resume] {filename} (partial — re-downloading)")

    if dry_run:
        size_mb = f"{file_size / 1024 / 1024:.1f} MB" if file_size else "unknown size"
        print(f"  [dry-run] Would download: {filename}  ({size_mb}, {captured_at})")
        return True

    print(f"  [fetch] Getting download URL for {filename} ...")
    download_url = get_download_url(session, media_id)
    if not download_url:
        print(f"  [warn] No download URL available for {filename} — skipping.")
        return False

    print(f"  [dl]    {filename}")
    download_file(download_url, dest_path, file_size)
    return True


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download videos from GoPro cloud storage.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    auth_group = parser.add_argument_group("Authentication")
    auth_group.add_argument(
        "--token",
        metavar="BEARER_TOKEN",
        help=(
            "GoPro access token. Extract the `gp_access_token` cookie value "
            "from your browser after logging in at https://plus.gopro.com/media-library/"
        ),
    )
    auth_group.add_argument("--username", metavar="EMAIL", help="GoPro account email")
    auth_group.add_argument("--password", metavar="PASSWORD", help="GoPro account password")
    auth_group.add_argument(
        "--client-id",
        metavar="CLIENT_ID",
        help="OAuth2 client_id (from a GoPro app, not publicly available)",
    )
    auth_group.add_argument(
        "--client-secret",
        metavar="CLIENT_SECRET",
        help="OAuth2 client_secret (from a GoPro app, not publicly available)",
    )

    dl_group = parser.add_argument_group("Download options")
    dl_group.add_argument(
        "--output",
        metavar="DIR",
        default="./gopro_downloads",
        help="Output directory (default: ./gopro_downloads)",
    )
    dl_group.add_argument(
        "--type",
        metavar="TYPE",
        default="Video",
        choices=["Video", "Photo", "TimeLapse", "TimeLapseVideo", "Burst", "all"],
        help=(
            "Media type to download: Video, Photo, TimeLapse, TimeLapseVideo, "
            "Burst, or 'all' (default: Video)"
        ),
    )
    dl_group.add_argument(
        "--per-page",
        type=int,
        default=100,
        metavar="N",
        help="Items fetched per API page (default: 100)",
    )
    dl_group.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would be downloaded without downloading anything",
    )
    dl_group.add_argument(
        "--list-only",
        action="store_true",
        help="Print media metadata as JSON and exit without downloading",
    )

    return parser.parse_args()


def resolve_token(args: argparse.Namespace) -> str:
    """Return a valid bearer token from CLI args or env vars."""
    # 1. Explicit --token flag
    if args.token:
        return args.token

    # 2. Environment variable
    env_token = os.environ.get("GOPRO_TOKEN")
    if env_token:
        print("[auth] Using token from GOPRO_TOKEN environment variable.")
        return env_token

    # 3. OAuth2 credentials flow
    username = args.username or os.environ.get("GOPRO_USERNAME")
    password = args.password or os.environ.get("GOPRO_PASSWORD")
    client_id = args.client_id or os.environ.get("GOPRO_CLIENT_ID")
    client_secret = args.client_secret or os.environ.get("GOPRO_CLIENT_SECRET")

    if username and password and client_id and client_secret:
        return authenticate_with_credentials(username, password, client_id, client_secret)

    # Nothing worked
    sys.exit(
        "[error] No authentication provided.\n\n"
        "Option 1 — Browser token (recommended):\n"
        "  1. Log in at https://plus.gopro.com/media-library/\n"
        "  2. Open DevTools → Application → Cookies\n"
        "  3. Copy the value of `gp_access_token`\n"
        "  4. Pass it as:  --token YOUR_TOKEN\n"
        "     or set:      export GOPRO_TOKEN=YOUR_TOKEN\n\n"
        "Option 2 — OAuth2 credentials:\n"
        "  Pass --username, --password, --client-id, --client-secret\n"
        "  (client_id / client_secret must be sourced from a GoPro app)\n"
    )


def main() -> None:
    args = parse_args()

    token = resolve_token(args)
    session = _build_session(token)

    media_type = None if args.type == "all" else args.type

    print(
        f"[info] Listing {'all' if not media_type else media_type} media from GoPro cloud..."
    )
    items = collect_all_media(session, media_type, per_page=args.per_page)

    if not items:
        print("[info] No media found.")
        return

    if args.list_only:
        print(json.dumps(items, indent=2))
        return

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    downloaded = 0
    skipped = 0

    print(
        f"\n[info] {'Simulating download of' if args.dry_run else 'Downloading'} "
        f"{len(items)} item(s) to {output_dir}/\n"
    )

    for i, item in enumerate(items, start=1):
        print(f"[{i}/{len(items)}]", end=" ")
        result = download_media_item(session, item, output_dir, dry_run=args.dry_run)
        if result:
            downloaded += 1
        else:
            skipped += 1

    action = "Would download" if args.dry_run else "Downloaded"
    print(
        f"\n[done] {action} {downloaded} file(s), skipped {skipped} file(s)."
    )


if __name__ == "__main__":
    main()
