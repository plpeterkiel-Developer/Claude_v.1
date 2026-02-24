Feature: GDPR — Data Privacy and User Rights

  Background:
    Given the database is empty
    And a verified user "Alice" exists

  # ─── Right to access ────────────────────────────────────────────────────────

  Scenario: User can download their personal data
    Given a logged-in user navigates to account settings
    When they click 'Download my data'
    Then they receive an email with a link to download a file containing all data held about them

  # ─── Right to erasure ───────────────────────────────────────────────────────

  Scenario: User can delete their account
    Given "Alice" is logged in
    When she deletes her account
    Then her account no longer exists in the database
    And she is logged out

  Scenario: Deleted account data is anonymised within 30 days
    Given a user has deleted their account
    When 30 days have passed
    Then all personally identifiable fields (name, email, avatar) are removed from the database
    And any reviews they left remain with the author shown as 'Account deleted'

  Scenario: Account deletion removes the user's tool listings
    Given "Alice" has 2 tool listings
    When she deletes her account
    Then both listings are removed from the browse page

  Scenario: Account deletion notifies borrowers of active requests
    Given "Alice" owns a tool with a pending request from "Bob"
    When "Alice" deletes her account
    Then the request status is updated to 'Cancelled'
    And "Bob" receives an email notifying them the request has been cancelled

  # ─── Right to rectification ─────────────────────────────────────────────────

  Scenario: User can edit their profile information
    Given "Alice" is logged in
    When she updates her display name to "Alice Updated"
    Then her profile shows the new name
