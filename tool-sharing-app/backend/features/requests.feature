Feature: Tool Borrowing Requests
  As a gardener
  I want to request, approve, and track tool loans
  So that borrowing and returning is clear and fair

  # -------------------------------------------------------
  # Creating a request
  # -------------------------------------------------------

  Scenario: Request to borrow an available tool
    Given user "owner@garden.com" owns an available tool called "Lawn Mower"
    And I am logged in as "borrower@garden.com" with password "BorrowerPass1!"
    When I POST a borrow request with message "Need it for the weekend"
    Then the response status should be 201
    And the response body should include "status" equal to "pending"

  Scenario: Cannot request your own tool
    Given I am logged in as "mytools@garden.com" with password "MyToolsPass1!"
    And I own an available tool called "My Trowel"
    When I POST a borrow request for my own tool
    Then the response status should be 400

  Scenario: Cannot request a tool that is already borrowed
    Given user "owner2@garden.com" owns an unavailable tool called "Taken Mower"
    And I am logged in as "borrower2@garden.com" with password "BorrowerPass1!"
    When I POST a borrow request for the unavailable tool
    Then the response status should be 409

  Scenario: Cannot submit a duplicate pending request
    Given user "owner3@garden.com" owns an available tool called "Shared Fork"
    And I am logged in as "dup@garden.com" with password "DupPass1!"
    And I already have a pending request for that tool
    When I POST another borrow request for the same tool
    Then the response status should be 409

  # -------------------------------------------------------
  # Viewing requests
  # -------------------------------------------------------

  Scenario: View my outgoing requests
    Given I am logged in as "viewer@garden.com" with password "ViewerPass1!"
    When I GET "/requests/mine"
    Then the response status should be 200
    And the response body should be a JSON array

  Scenario: View incoming requests on my tools
    Given I am logged in as "toolowner@garden.com" with password "OwnerPass1!"
    When I GET "/requests/received"
    Then the response status should be 200
    And the response body should be a JSON array

  # -------------------------------------------------------
  # Status transitions
  # -------------------------------------------------------

  Scenario: Owner approves a pending request
    Given there is a pending request between "lender@garden.com" and "asker@garden.com"
    And I am logged in as "lender@garden.com" with password "LenderPass1!"
    When I PUT the request with status "approved"
    Then the response status should be 200
    And the response body should include "status" equal to "approved"
    And the tool should now be unavailable

  Scenario: Owner rejects a pending request
    Given there is a pending request between "lender2@garden.com" and "asker2@garden.com"
    And I am logged in as "lender2@garden.com" with password "Lender2Pass1!"
    When I PUT the request with status "rejected"
    Then the response status should be 200
    And the response body should include "status" equal to "rejected"

  Scenario: Borrower marks a tool as returned
    Given there is an approved request between "lender3@garden.com" and "asker3@garden.com"
    And I am logged in as "asker3@garden.com" with password "Asker3Pass1!"
    When I PUT the request with status "returned"
    Then the response status should be 200
    And the response body should include "status" equal to "returned"
    And the tool should now be available

  Scenario: Owner cannot set status to "returned"
    Given there is a pending request between "lender4@garden.com" and "asker4@garden.com"
    And I am logged in as "lender4@garden.com" with password "Lender4Pass1!"
    When I PUT the request with status "returned"
    Then the response status should be 400

  Scenario: Borrower cannot set status to "approved"
    Given there is a pending request between "lender5@garden.com" and "asker5@garden.com"
    And I am logged in as "asker5@garden.com" with password "Asker5Pass1!"
    When I PUT the request with status "approved"
    Then the response status should be 400
