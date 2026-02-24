Feature: Reviews

  Background:
    Given the database is empty
    And a verified user "Alice" exists
    And a verified user "Bob" exists
    And "Bob" borrowed a tool from "Alice" and the loan is marked as returned

  Scenario: User leaves a review after a completed loan
    Given a loan has been marked as returned by both parties
    When the borrower submits a 4-star rating and a comment
    Then the review is saved and appears on the lender's public profile

  Scenario: Lender can also leave a review for the borrower
    Given a loan has been marked as returned
    When "Alice" submits a 5-star review for "Bob"
    Then the review appears on "Bob"'s public profile

  Scenario: User cannot leave a review for an active (non-returned) loan
    Given "Bob" has an accepted but not-yet-returned loan
    When "Bob" attempts to submit a review
    Then they receive a 400 Bad Request error

  Scenario: User cannot leave a duplicate review for the same loan
    Given "Bob" has already submitted a review for a completed loan
    When "Bob" attempts to submit another review for the same loan
    Then they receive a 409 Conflict error

  Scenario: User cannot review a loan they were not part of
    Given a completed loan between "Alice" and "Bob"
    And a third user "Carol" exists
    When "Carol" attempts to submit a review for the loan
    Then they receive a 403 Forbidden error
