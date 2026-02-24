Feature: Tool Listings

  Background:
    Given the database is empty
    And a verified user "Alice" exists with email "alice@example.com"
    And a verified user "Bob" exists with email "bob@example.com"

  # ─── Creating listings ───────────────────────────────────────────────────────

  Scenario: User lists a tool for sharing
    Given a logged-in user is on the 'Add Tool' page
    When they complete and submit the listing form with a tool name and description
    Then the tool appears in the browse page with status 'Available'

  Scenario: User cannot list a tool without a verified email
    Given a user has registered but not yet verified their email
    When they attempt to submit a new tool listing
    Then they are shown a message asking them to verify their email first
    And no listing is created

  # ─── Pick-up address privacy ─────────────────────────────────────────────────

  Scenario: Pick-up point address is only revealed after a request is accepted
    Given a logged-in user is browsing tool listings
    When they view a tool listing before sending a request
    Then they can see the general area but not the full pick-up point address
    And the full address is shown only after the owner accepts their request

  Scenario: Pick-up point address is not accessible via the API without an accepted request
    Given a logged-in user has a pending (not yet accepted) borrow request
    When they call the API endpoint for that tool's details
    Then the response does not include the full pick-up point address

  # ─── Tool status ─────────────────────────────────────────────────────────────

  Scenario: Tool status changes when a request is accepted
    Given a tool has status 'Available' and a borrow request is pending
    When the tool owner accepts the request
    Then the tool status changes to 'On Loan' and other pending requests are paused

  Scenario: Tool status returns to available when loan is marked returned
    Given a tool has status 'On Loan' with an accepted request
    When either party marks the loan as returned
    Then the tool status changes back to 'Available'

  # ─── Editing and deleting ────────────────────────────────────────────────────

  Scenario: Owner can edit their listing at any time
    Given "Alice" owns a tool listing
    When she updates the tool description
    Then the listing shows the new description

  Scenario: Owner can delete their listing
    Given "Alice" owns a tool listing
    When she deletes the listing
    Then the listing no longer appears on the browse page

  Scenario: Non-owner cannot edit a listing
    Given "Alice" owns a tool listing
    When "Bob" attempts to edit the listing via the API
    Then they receive a 403 Forbidden error

  # ─── Overdue ─────────────────────────────────────────────────────────────────

  Scenario: Overdue reminder is sent when a loan passes its end date
    Given an accepted loan has an end date of today
    When midnight passes without the loan being marked as returned
    Then the request status is updated to 'Overdue'
    And the borrower receives a reminder email to return the tool

  # ─── Account deletion ────────────────────────────────────────────────────────

  Scenario: Reviews remain visible after account deletion
    Given a user has left reviews on other users' profiles
    When that user deletes their account
    Then their reviews remain visible on the relevant profiles
    And the reviewer is shown as 'Account deleted' rather than their name
