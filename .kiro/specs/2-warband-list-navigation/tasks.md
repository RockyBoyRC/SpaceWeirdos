# Implementation Plan

## Completed Tasks

- [x] 1. Set up API client for backend communication
- [x] 1.1 Create apiClient service
  - Implement HTTP client wrapper (axios or fetch)
  - Add request/response interceptors
  - Add error handling for network failures
  - Configure base URL and headers
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 1.2 Define API response types
  - Create TypeScript interfaces for API responses
  - Define success and error response formats
  - Add WarbandSummary type for list responses
  - _Requirements: 7.5, 7.7_

- [x] 2. Set up warband list context and state management
- [x] 2.1 WarbandContext implementation (already exists in WarbandContext.tsx)
  - Context provides warband CRUD operations via API calls
  - Manages warband and weirdo state
  - Handles API response success and error cases
  - _Requirements: 1.1, 2.1, 2.2, 3.4, 4.1-4.6, 7.1-7.7_

- [x] 3. Refactor WarbandContext to use API calls
- [x] 3.1 Replace direct DataRepository calls with API calls
  - Replace DataRepository.getAllWarbands() with GET /api/warbands
  - Replace DataRepository.createWarband() with POST /api/warbands
  - Replace DataRepository.updateWarband() with PUT /api/warbands/:id
  - Replace DataRepository.deleteWarband() with DELETE /api/warbands/:id
  - Remove direct imports of DataRepository
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [x] 3.2 Add API error handling
  - Handle network failures gracefully
  - Display user-friendly error messages
  - Add retry logic for transient failures
  - _Requirements: 7.5_

- [x] 4. Implement warband list view components
- [x] 4.1 WarbandList component implemented
  - Fetches warbands via API on mount
  - Displays loading, empty, and error states
  - Renders WarbandListItem for each warband
  - Includes "Create New Warband" button
  - Manages delete confirmation dialog
  - _Requirements: 1.1, 1.7, 1.8, 2.1, 7.1_

- [x] 4.2 WarbandListItem component implemented
  - Displays all warband information (name, ability, costs, weirdo count)
  - Click handler to select warband
  - Delete button with danger styling
  - Card styling with hover states
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 3.1, 5.1, 5.2, 5.3_

- [x] 5. Implement delete confirmation dialog
- [x] 5.1 DeleteConfirmationDialog component implemented
  - Modal dialog with overlay
  - Displays warband name
  - Confirm and Cancel buttons
  - Focus trap and keyboard navigation
  - Escape key and click outside to cancel
  - _Requirements: 3.2, 3.3, 3.5_

- [x] 6. Implement toast notification system
- [x] 6.1 ToastNotification component implemented
  - Success and error styling
  - Auto-dismiss after 4 seconds
  - Manual dismiss button
  - Positioned at top-right
  - Slide-in animation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Implement warband creation flow
- [x] 7.1 Create new warband functionality implemented in App.tsx
  - Creates warband with defaults via API call
  - Navigates to editor
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 6.5, 7.2_

- [x] 8. Implement warband deletion flow
- [x] 8.1 Delete warband functionality implemented
  - Shows DeleteConfirmationDialog
  - Calls DELETE /api/warbands/:id via API client
  - Updates list after deletion
  - Displays success/error notifications
  - _Requirements: 3.4, 3.6, 3.7, 4.3, 4.4, 7.4_

- [x] 9. Implement navigation between list and editor
- [x] 9.1 Navigation functionality implemented in App.tsx
  - View state management (list/editor)
  - Load warband on selection
  - Back to list button in editor
  - _Requirements: 1.9, 6.1, 6.2, 6.4, 6.5_

- [x] 10. Style components with design system
- [x] 10.1 All component styles implemented
  - WarbandList.css with card styles
  - DeleteConfirmationDialog.css with modal styles
  - ToastNotification.css with notification styles
  - Responsive design included
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Add accessibility features
- [x] 11.1 Accessibility features implemented
  - ARIA labels on all interactive elements
  - ARIA live regions for notifications
  - Focus management in dialogs
  - Keyboard navigation (Tab, Escape)
  - _Requirements: All_

## New Tasks for Warband Duplication Feature

- [ ] 12. Implement warband duplication API endpoint
- [x] 12.1 Add POST /api/warbands/:id/duplicate endpoint


  - Create endpoint in warbandRoutes.ts
  - Implement warband duplication logic with unique ID generation
  - Generate unique names for duplicated warbands
  - Copy all warband properties and weirdos
  - Return duplicated warband data
  - _Requirements: 7.4, 7.8, 7.9, 7.10, 8.5_

- [ ]* 12.2 Write property test for warband duplication API
  - **Property 6: Warband duplication creates complete copy**
  - **Validates: Requirements 7.4, 7.9, 7.10**

- [ ]* 12.3 Write property test for unique name generation
  - **Property 9: Duplicate names are unique**
  - **Validates: Requirements 7.8**



- [ ] 13. Add duplication to API client
- [ ] 13.1 Add duplicateWarband method to apiClient
  - Implement HTTP POST call to duplication endpoint
  - Handle success and error responses
  - Add TypeScript types for duplication response
  - _Requirements: 8.5, 8.6_

- [ ]* 13.2 Write unit tests for API client duplication method
  - Test successful duplication API call
  - Test error handling for failed duplication


  - _Requirements: 8.5, 8.6_

- [ ] 14. Implement duplicate confirmation dialog
- [ ] 14.1 Create DuplicateConfirmationDialog component
  - Modal dialog with overlay
  - Display warband name being duplicated
  - Confirm and Cancel buttons
  - Focus trap and keyboard navigation
  - Escape key and click outside to cancel
  - _Requirements: 7.2, 7.3, 7.5_

- [ ]* 14.2 Write unit tests for DuplicateConfirmationDialog
  - Test dialog rendering with warband name


  - Test confirm and cancel button functionality
  - Test keyboard navigation and accessibility
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 15. Add duplication functionality to WarbandContext
- [ ] 15.1 Add duplicateWarband method to WarbandContext
  - Implement duplication logic using API client
  - Handle success and error cases
  - Update warband list after successful duplication
  - Show success/error notifications


  - _Requirements: 7.4, 7.6, 7.7, 8.5_

- [ ]* 15.2 Write property test for context duplication
  - **Property 8: Duplicate operations update list and provide feedback**
  - **Validates: Requirements 7.6, 7.7**

- [ ] 16. Update WarbandListItem component
- [ ] 16.1 Add duplicate button to WarbandListItem
  - Add duplicate button with appropriate styling
  - Position duplicate and delete buttons properly
  - Add click handler for duplication


  - _Requirements: 7.1_

- [ ]* 16.2 Write unit tests for updated WarbandListItem
  - Test duplicate button rendering
  - Test duplicate button click handling
  - Test button positioning and styling
  - _Requirements: 7.1_

- [x] 17. Update WarbandList component


- [ ] 17.1 Add duplicate confirmation dialog to WarbandList
  - Integrate DuplicateConfirmationDialog
  - Manage dialog state (open/close)
  - Handle confirm and cancel actions
  - _Requirements: 7.2, 7.5_

- [ ]* 17.2 Write property test for duplicate confirmation flow
  - **Property 7: Duplicate confirmation prevents accidental duplication**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [ ] 18. Style duplicate confirmation dialog
- [ ] 18.1 Create CSS styles for DuplicateConfirmationDialog
  - Modal overlay and dialog styles


  - Button styling (primary for confirm, secondary for cancel)
  - Responsive design
  - Accessibility features
  - _Requirements: 7.2, 7.3_

- [ ] 19. Integration testing for duplication feature
- [ ] 19.1 Write integration tests for complete duplication flow
  - Test end-to-end duplication process
  - Test error handling scenarios
  - Test UI state updates
  - _Requirements: 7.1-7.10_

- [ ] 20. Final checkpoint for duplication feature
- [ ] 20.1 Ensure all duplication tests pass
  - Run all unit and property tests
  - Verify integration tests pass
  - Test manual duplication scenarios
  - _Requirements: All_

## Completed Tasks

[Previous completed tasks remain the same...]
