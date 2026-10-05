# Spreadsheet Template

A Markdown replacement for a simple Excel sheet. GitHub, VS Code, Obsidian, Notion and most Markdown viewers show the tables below as normal tables.

---

## Main Table (15 columns)

| # | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 | Column 6 | Column 7 | Column 8 | Column 9 | Column 10 | Column 11 | Column 12 | Column 13 | Column 14 |
|--:|----------|----------|----------|----------|----------|----------|----------|----------|----------|-----------|-----------|-----------|-----------|-----------|
| 1 |          |          |          |          |          |          |          |          |          |           |           |           |           |           |
| 2 |          |          |          |          |          |          |          |          |          |           |           |           |           |           |
| 3 |          |          |          |          |          |          |          |          |          |           |           |           |           |           |
| 4 |          |          |          |          |          |          |          |          |          |           |           |           |           |           |
| 5 |          |          |          |          |          |          |          |          |          |           |           |           |           |           |

---

## Example (filled in)

| # | Date       | Task            | Owner | Status      | Priority | Category | Start      | Due        | Hours | Cost (DKK) | Paid | Location   | Contact | Notes          |
|--:|------------|-----------------|-------|-------------|:--------:|----------|------------|------------|------:|-----------:|:----:|------------|---------|----------------|
| 1 | 2026-10-05 | Order materials | Peter | In progress | High     | Purchase | 2026-10-05 | 2026-10-10 |     2 |      4.500 | ✅   | Copenhagen | Anna    | Bricks + mortar |
| 2 | 2026-10-06 | Book scaffolding | Peter | Not started | Medium   | Rental   | 2026-10-12 | 2026-10-20 |     1 |      2.000 | ❌   | Aarhus     | Jens    |                |

---

## How to use and expand

**Add a row:** copy any row (one full line starting and ending with `|`) and paste it below. Change the values.

**Add a column:** add one more `| Header |` to the header line, one more `|---|` to the separator line, and one more `|  |` cell to every row. Every row must have the same number of `|` cells as the header.

**Rename a column:** just change the text in the header line.

**Alignment** (set in the second line, under each header):

| Separator | Result         |
|-----------|----------------|
| `---`     | left (default) |
| `:---:`   | centered       |
| `---:`    | right — best for numbers |

**Formatting inside cells:** `**bold**`, `*italic*`, `` `code` ``, `[link](https://example.com)`, emoji like ✅ ❌ ⚠️. Use `<br>` for a line break inside a cell, and `\|` if you need a literal `|` character.

**Spacing doesn't matter:** the columns don't have to line up in the raw text to render correctly — lining them up just makes the file easier to read while editing.

**Limits compared to Excel:** no formulas, sorting or filtering. If you need totals, calculate them yourself and add a "Total" row.
