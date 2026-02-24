Feature: Moderation

  Background:
    Given the database is empty
    And an admin user "admin@toolshare.dk" exists
    And a verified user "Alice" exists with a tool listing
    And a verified user "Bob" exists

  Scenario: User reports an inappropriate tool listing
    Given a logged-in user is viewing a tool listing
    When they click 'Report' and submit a reason
    Then a report is created with status 'Pending' for admin review
    And the listing remains visible until an admin makes a decision

  Scenario: User reports a review
    Given "Bob" has a review on their profile
    When "Alice" reports the review with a reason
    Then a report is created with status 'Pending'

  Scenario: Admin issues a warning for a minor violation
    Given an admin is reviewing a pending report
    When they select 'Issue Warning' and confirm
    Then the reported user's warning count increases by 1
    And the user receives an email notifying them of the warning

  Scenario: Admin removes a listing
    Given an admin is reviewing a pending report for a listing
    When they select 'Remove content' and confirm
    Then the listing is deleted from the platform
    And the report status is updated to 'Removed'

  Scenario: Admin removes a review
    Given an admin is reviewing a pending report for a review
    When they select 'Remove content' and confirm
    Then the review is marked as removed and no longer shown publicly
    And the report status is updated to 'Removed'

  Scenario: Admin suspends a user for a major violation
    Given an admin is reviewing a report against a user
    When they select 'Suspend Account' and confirm
    Then the user's account is deactivated
    And the user receives an email informing them of the suspension
    And the user can no longer log in

  Scenario: Non-admin cannot access the reports list
    Given "Bob" is logged in (not an admin)
    When they attempt to GET /reports
    Then they receive a 403 Forbidden error

  Scenario: Non-admin cannot resolve a report
    Given there is a pending report
    When "Bob" attempts to PATCH /reports/:id
    Then they receive a 403 Forbidden error
