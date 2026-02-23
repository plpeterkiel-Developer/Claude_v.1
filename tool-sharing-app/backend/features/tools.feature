Feature: Tool Management
  As a gardener
  I want to add, browse and manage gardening tools
  So that the community can share equipment

  # -------------------------------------------------------
  # Browsing (public)
  # -------------------------------------------------------

  Scenario: Browse available tools without being logged in
    Given the API is running
    And the database has some available tools
    When I GET "/tools"
    Then the response status should be 200
    And the response body should be a JSON array

  Scenario: Get a single tool by ID
    Given the API is running
    And the database has some available tools
    When I GET the first tool's detail page
    Then the response status should be 200
    And the response body should include "name"

  # -------------------------------------------------------
  # Adding tools (authenticated)
  # -------------------------------------------------------

  Scenario: Add a new tool when logged in
    Given I am logged in as "gina@garden.com" with password "GinaPass1!"
    When I POST "/tools" with body:
      | name        | Garden Spade           |
      | description | Heavy-duty garden spade |
      | category    | digging                |
      | condition   | excellent              |
    Then the response status should be 201
    And the response body should include "name" equal to "Garden Spade"

  Scenario: Adding a tool without a name is rejected
    Given I am logged in as "gina@garden.com" with password "GinaPass1!"
    When I POST "/tools" with body:
      | description | No name provided |
    Then the response status should be 400

  Scenario: Cannot add a tool when not logged in
    Given the API is running
    When I POST "/tools" with body:
      | name | Sneaky Spade |
    Then the response status should be 401

  # -------------------------------------------------------
  # My tools
  # -------------------------------------------------------

  Scenario: View my own tools
    Given I am logged in as "henry@garden.com" with password "HenryPass1!"
    And I own a tool called "My Hoe"
    When I GET "/tools/mine"
    Then the response status should be 200
    And the response body should be a JSON array

  # -------------------------------------------------------
  # Updating tools
  # -------------------------------------------------------

  Scenario: Update my own tool
    Given I am logged in as "ida@garden.com" with password "IdaPass1!"
    And I own a tool called "Old Trowel"
    When I PUT my tool with body:
      | name | Shiny New Trowel |
    Then the response status should be 200
    And the response body should include "name" equal to "Shiny New Trowel"

  Scenario: Cannot update a tool I do not own
    Given I am logged in as "jack@garden.com" with password "JackPass1!"
    And another user owns a tool
    When I try to PUT that other user's tool
    Then the response status should be 403

  # -------------------------------------------------------
  # Deleting tools
  # -------------------------------------------------------

  Scenario: Delete my own tool
    Given I am logged in as "kate@garden.com" with password "KatePass1!"
    And I own a tool called "Rusty Fork"
    When I DELETE my tool
    Then the response status should be 200

  Scenario: Cannot delete a tool I do not own
    Given I am logged in as "leo@garden.com" with password "LeoPass1!"
    And another user owns a tool
    When I try to DELETE that other user's tool
    Then the response status should be 403
