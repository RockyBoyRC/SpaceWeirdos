  # Implementation Plan

- [x] 1. Set up project structure and game data





  - Create directory structure for backend services, models, and data
  - Create JSON files for game data (attributes, weapons, equipment, psychic powers, abilities, traits)
  - Define TypeScript types and interfaces for all data models
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

- [x] 2. Implement core data models and cost engine





  - [x] 2.1 Create TypeScript interfaces for Warband, Weirdo, Attributes, Weapon, Equipment, PsychicPower


    - Define all types and interfaces in `src/backend/models/`
    - Include validation types (ValidationError, ValidationResult)
    - _Requirements: 2.1, 7.1_

  - [x] 2.2 Implement Cost Engine service


    - Create `CostEngine` class with methods for calculating costs
    - Implement attribute cost calculation with lookup table
    - Implement weapon cost calculation with warband ability modifiers
    - Implement equipment cost calculation with warband ability modifiers
    - Implement psychic power cost calculation
    - Implement weirdo total cost calculation
    - Implement warband total cost calculation
    - Ensure all costs clamp at minimum 0
    - _Requirements: 2.3-2.17, 3.4, 3.5, 4.3, 5.2, 5.3, 7.8, 8.1-8.9, 10.1_

  - [x] 2.3 Write property test for Cost Engine


    - **Property 4: Attribute costs are calculated correctly**
    - **Validates: Requirements 2.3-2.17, 7.2, 8.2**

  - [x] 2.4 Write property test for weapon cost calculation


    - **Property 7: Weapon costs accumulate correctly**
    - **Validates: Requirements 3.4, 3.5, 8.1, 8.3, 8.4, 8.5**

  - [x] 2.5 Write property test for equipment cost calculation


    - **Property 9: Equipment costs accumulate correctly**
    - **Validates: Requirements 4.3, 8.6, 8.7, 8.8**

  - [x] 2.6 Write property test for cost reduction minimum


    - **Property 13: Cost reductions never go below zero**
    - **Validates: Requirements 8.9**

  - [x] 2.7 Write property test for weirdo total cost


    - **Property 12: Weirdo total cost equals sum of all components**
    - **Validates: Requirements 7.8**

  - [x] 2.8 Write property test for warband total cost


    - **Property 16: Warband total cost equals sum of weirdo costs**
    - **Validates: Requirements 10.1**

- [x] 3. Implement validation service





  - [x] 3.1 Create Validation Service with rule enforcement


    - Implement warband name validation (non-empty string)
    - Implement point limit validation (75 or 125)
    - Implement warband ability validation (required selection)
    - Implement weirdo name validation (non-empty string)
    - Implement attribute completeness validation (all 5 required)
    - Implement close combat weapon requirement validation
    - Implement ranged weapon requirement validation (based on Firepower)
    - Implement equipment limit validation (based on type and Cyborgs ability)
    - Implement trooper 20-point limit validation
    - Implement 25-point weirdo limit validation (only one allowed)
    - Implement warband point limit validation
    - Implement leader trait validation (only for leaders)
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 6.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2, 9.3, 9.4, 10.2, 10.3, 10.4_

  - [x] 3.2 Write property test for warband creation validation


    - **Property 1: Warband creation requires all mandatory fields**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

  - [x] 3.3 Write property test for weirdo creation validation


    - **Property 3: Weirdo creation requires name and all attributes**
    - **Validates: Requirements 2.1, 2.2, 7.1, 7.2**

  - [x] 3.4 Write property test for weapon requirements


    - **Property 5: Close combat weapon requirement is enforced**
    - **Validates: Requirements 3.1, 7.3**

  - [x] 3.5 Write property test for ranged weapon requirements


    - **Property 6: Ranged weapon requirement depends on Firepower level**
    - **Validates: Requirements 3.2, 3.3, 7.4**

  - [x] 3.6 Write property test for equipment limits

    - **Property 8: Equipment limits are enforced based on type and ability**
    - **Validates: Requirements 4.1, 4.2, 4.4, 7.5, 7.6**

  - [x] 3.7 Write property test for psychic power limits

    - **Property 10: Psychic powers are unlimited and costs accumulate**
    - **Validates: Requirements 5.1, 5.2, 5.3, 7.7**

  - [x] 3.8 Write property test for leader trait validation

    - **Property 11: Leader traits are optional and singular**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 3.9 Write property test for trooper point limit


    - **Property 14: Trooper point limit is enforced**
    - **Validates: Requirements 9.1, 9.3, 9.4**

  - [x] 3.10 Write property test for 25-point weirdo limit


    - **Property 15: Exactly one weirdo may cost 21-25 points**
    - **Validates: Requirements 9.2, 9.3**

  - [x] 3.11 Write property test for warband point limit


    - **Property 17: Warband point limit is enforced**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 4. Implement data repository and persistence




  - [x] 4.1 Create Data Repository with in-memory storage


    - Implement Map-based storage for warbands
    - Implement saveWarband method
    - Implement loadWarband method
    - Implement loadAllWarbands method
    - Implement deleteWarband method
    - Generate unique IDs using UUID
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 13.1, 14.2_

  - [x] 4.2 Implement JSON file persistence

    - Implement persistToFile method (serialize Map to JSON)
    - Implement loadFromFile method (deserialize JSON to Map)
    - Create data/warbands.json file
    - Trigger async persist on save/delete operations
    - Load data on server startup
    - _Requirements: 11.1, 11.2, 12.1, 12.2_

  - [x] 4.3 Write property test for warband persistence


    - **Property 18: Warband persistence preserves all data**
    - **Validates: Requirements 11.1, 11.2, 12.1, 12.2**

  - [x] 4.4 Write property test for unique IDs

    - **Property 19: Warband IDs are unique**
    - **Validates: Requirements 11.3**

  - [x] 4.5 Write property test for cost recalculation on load

    - **Property 20: Loaded warbands recalculate costs correctly**
    - **Validates: Requirements 12.3**

  - [x] 4.6 Write property test for deletion

    - **Property 23: Warband deletion removes from storage**
    - **Validates: Requirements 14.2**

  - [x] 4.7 Write property test for deletion cancellation

    - **Property 24: Deletion cancellation preserves warband**
    - **Validates: Requirements 14.4**

- [x] 5. Implement Warband Service




  - [x] 5.1 Create Warband Service orchestration layer


    - Implement createWarband method (initialize with zero cost)
    - Implement getWarband method
    - Implement getAllWarbands method
    - Implement updateWarband method (with cost recalculation)
    - Implement deleteWarband method
    - Implement validateWarband method
    - Coordinate between CostEngine, ValidationService, and DataRepository
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 13.1, 14.2_

  - [x] 5.2 Write property test for new warband initialization


    - **Property 2: New warbands initialize with zero cost**
    - **Validates: Requirements 1.3**

  - [x] 5.3 Write property test for loaded warband validation


    - **Property 21: Loaded warbands are validated like new warbands**
    - **Validates: Requirements 12.4**

  - [x] 5.4 Write property test for warband list


    - **Property 22: Warband list contains all saved warbands**
    - **Validates: Requirements 13.1, 13.2, 13.3**

- [x] 6. Implement Express API endpoints





  - [x] 6.1 Create Express router and API endpoints


    - Implement POST /api/warbands (create warband)
    - Implement GET /api/warbands (get all warbands)
    - Implement GET /api/warbands/:id (get specific warband)
    - Implement PUT /api/warbands/:id (update warband)
    - Implement DELETE /api/warbands/:id (delete warband)
    - Implement POST /api/warbands/:id/weirdos (add weirdo)
    - Implement PUT /api/warbands/:id/weirdos/:weirdoId (update weirdo)
    - Implement DELETE /api/warbands/:id/weirdos/:weirdoId (remove weirdo)
    - Implement POST /api/calculate-cost (calculate cost)
    - Implement POST /api/validate (validate warband/weirdo)
    - Add error handling middleware
    - _Requirements: 1.1-1.5, 2.1-2.17, 3.1-3.5, 4.1-4.4, 5.1-5.3, 6.1-6.3, 7.1-7.8, 8.1-8.9, 9.1-9.4, 10.1-10.4, 11.1-11.4, 12.1-12.4, 13.1-13.4, 14.1-14.4, 15.1-15.2_

  - [x] 6.2 Write integration tests for API endpoints


    - Test create warband endpoint
    - Test get all warbands endpoint
    - Test get specific warband endpoint
    - Test update warband endpoint
    - Test delete warband endpoint
    - Test add weirdo endpoint
    - Test update weirdo endpoint
    - Test remove weirdo endpoint
    - Test calculate cost endpoint
    - Test validate endpoint
    - _Requirements: All_

- [x] 7. Checkpoint - Ensure all backend tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement frontend API client




  - [x] 8.1 Create API client service


    - Implement createWarband API call
    - Implement getAllWarbands API call
    - Implement getWarband API call
    - Implement updateWarband API call
    - Implement deleteWarband API call
    - Implement addWeirdo API call
    - Implement updateWeirdo API call
    - Implement removeWeirdo API call
    - Implement calculateCost API call
    - Implement validate API call
    - Add error handling and retry logic
    - _Requirements: All_

- [x] 9. Implement Warband List Component




  - [x] 9.1 Create WarbandListComponent


    - Implement component with state for warbands, loading, and errors
    - Implement loadWarbands method (fetch from API)
    - Implement handleLoadWarband method (navigate to editor)
    - Implement handleDeleteWarband method (prompt and delete)
    - Display warband name, ability, point limit, total cost, and weirdo count
    - Display message when no warbands exist
    - Add loading and error states
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.2, 14.3, 14.4_

  - [x] 9.2 Write unit tests for WarbandListComponent


    - Test loading warbands
    - Test displaying warband list
    - Test loading a warband
    - Test deleting a warband
    - Test delete confirmation
    - Test delete cancellation
    - Test empty state
    - _Requirements: 13.1-13.4, 14.1-14.4_

- [x] 10. Implement Warband Editor Component




  - [x] 10.1 Create WarbandEditorComponent


    - Implement component with state for warband, selected weirdo, and validation errors
    - Implement handleNameChange method
    - Implement handleAbilityChange method (trigger cost recalculation)
    - Implement handlePointLimitChange method
    - Implement handleAddWeirdo method (create leader or trooper)
    - Implement handleRemoveWeirdo method
    - Implement handleSaveWarband method (validate and save)
    - Implement calculateTotalCost method
    - Display real-time cost calculations
    - Display validation errors
    - Display warning indicators when approaching limits
    - _Requirements: 1.1, 1.2, 1.4, 9.4, 10.3, 11.1, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 10.2 Write unit tests for WarbandEditorComponent


    - Test creating new warband
    - Test loading existing warband
    - Test changing warband name
    - Test changing warband ability
    - Test changing point limit
    - Test adding weirdos
    - Test removing weirdos
    - Test saving warband
    - Test validation errors
    - Test cost calculations
    - _Requirements: 1.1-1.5, 9.4, 10.3, 11.1-11.4, 15.1-15.5_

- [x] 11. Implement Weirdo Editor Component




  - [x] 11.1 Create WeirdoEditorComponent


    - Implement component with state for weirdo, point cost, and validation errors
    - Implement handleAttributeChange method
    - Implement handleAddWeapon method (close and ranged)
    - Implement handleRemoveWeapon method
    - Implement handleAddEquipment method (enforce limits)
    - Implement handleRemoveEquipment method
    - Implement handleAddPsychicPower method
    - Implement handleRemovePsychicPower method
    - Implement handleLeaderTraitChange method (leader only)
    - Implement recalculateCost method
    - Display real-time cost calculations
    - Display validation errors
    - Display warning indicators when approaching limits
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 4.4, 5.1, 6.1, 6.2, 6.3, 7.1-7.7, 9.4, 15.1, 15.2, 15.3, 15.4_

  - [x] 11.2 Write unit tests for WeirdoEditorComponent


    - Test creating new weirdo
    - Test editing existing weirdo
    - Test changing attributes
    - Test adding/removing weapons
    - Test adding/removing equipment
    - Test equipment limits
    - Test adding/removing psychic powers
    - Test leader trait selection
    - Test validation errors
    - Test cost calculations
    - _Requirements: 2.1-2.17, 3.1-3.5, 4.1-4.4, 5.1-5.3, 6.1-6.3, 7.1-7.8, 9.4, 15.1-15.4_

- [x] 12. Implement cascading cost updates





  - [x] 12.1 Add reactive cost calculation to frontend


    - Implement cost update propagation from weirdo to warband
    - Ensure immediate recalculation on any change
    - Update UI to reflect new costs
    - _Requirements: 15.1, 15.2_

  - [x] 12.2 Write property test for cascading updates


    - **Property 25: Cost changes cascade through the system**
    - **Validates: Requirements 15.1, 15.2**

- [x] 13. Add styling and polish




  - [x] 13.1 Style all components


    - Create consistent styling for all components
    - Add responsive design for mobile and desktop
    - Add visual indicators for warnings and errors
    - Add loading spinners and transitions
    - Ensure accessibility compliance
    - _Requirements: 15.3, 15.4, 15.5_

- [x] 14. Final checkpoint - Ensure all tests pass









  - Ensure all tests pass, ask the user if questions arise.
