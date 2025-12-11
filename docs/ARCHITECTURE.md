# Architecture Overview

## System Architecture

The Space Weirdos Warband Builder follows a modern, layered architecture with clear separation of concerns and API-first design principles.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│              (React + TypeScript)                       │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  UI Components   │  │  Hooks & State Mgmt      │    │
│  │  - WeirdoEditor  │  │  - useCostCalculation    │    │
│  │  - CostDisplays  │  │  - useValidation         │    │
│  │  - Selectors     │  │  - useWarband            │    │
│  └──────────────────┘  └──────────────────────────┘    │
│           │                        │                     │
│           └────────────┬───────────┘                     │
│                        ▼                                 │
│           ┌─────────────────────────┐                   │
│           │     API Client Layer    │                   │
│           │  - Type-safe requests   │                   │
│           │  - Error handling       │                   │
│           │  - Response parsing     │                   │
│           └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                          │ HTTP API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend Layer                         │
│               (Node.js + Express)                       │
│  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  API Routes      │  │  Business Logic          │    │
│  │  - Cost calc     │  │  - ValidationService     │    │
│  │  - Validation    │  │  - CostEngine            │    │
│  │  - Warband CRUD  │  │  - CostModifierStrategy  │    │
│  └──────────────────┘  └──────────────────────────┘    │
│           │                        │                     │
│           └────────────┬───────────┘                     │
│                        ▼                                 │
│           ┌─────────────────────────┐                   │
│           │     Data Layer          │                   │
│           │  - Type definitions     │                   │
│           │  - Game constants       │                   │
│           │  - Validation rules     │                   │
│           └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Key Architectural Principles

### 1. API-First Design

**Mandatory API Layer:**
- All frontend-backend communication goes through HTTP API endpoints
- Frontend components never directly access backend services
- Type-safe API client provides consistent interface
- Clear separation enables independent development and testing

**Benefits:**
- Easier testing through API mocking
- Consistent error handling
- Type safety across the boundary
- Enables future backend changes without frontend modifications

### 2. Centralized Validation System

**Intelligent Warning System:**
- Backend ValidationService generates warnings based on game rules
- Context-aware logic considers existing 25-point weirdos
- Warnings trigger within 3 points of applicable limits
- Clear messaging helps users understand which limits apply
- Frontend components use API-driven warnings exclusively

**Centralized Constants:**
```typescript
// Backend: src/backend/constants/costs.ts
export const TROOPER_LIMITS = {
  STANDARD_LIMIT: 20,     // Standard maximum for troopers
  MAXIMUM_LIMIT: 25,      // Absolute maximum (premium slot)
  SPECIAL_SLOT_MIN: 21,   // Minimum for premium slot
  SPECIAL_SLOT_MAX: 25,   // Maximum for premium slot
} as const;
```

**Context-Aware Warning Logic:**
```typescript
// Backend ValidationService
const warningThreshold = 3; // Centralized threshold

if (hasOther25PointWeirdo) {
  // Another weirdo uses premium slot - warn at 18-20 (20-point limit)
  if (pointsFrom20 >= 0 && pointsFrom20 <= warningThreshold) {
    warnings.push("Cost is within X points of the 20-point limit");
  }
} else if (isThis25PointWeirdo) {
  // This weirdo uses premium slot - warn at 23-25 (25-point limit)
  if (pointsFrom25 >= 0 && pointsFrom25 <= warningThreshold) {
    warnings.push("Cost is within X points of the 25-point limit");
  }
} else {
  // No premium slot used - warn at both 18-20 AND 23-25
  // Provides guidance for both possible limits
}
```

**Frontend Integration:**
```typescript
// Frontend components use centralized hooks
const costResult = useCostCalculation({
  weirdoType: weirdo.type,
  attributes: weirdo.attributes,
  // ... other params
});

// API-driven warning states (no hardcoded limits)
const isApproachingLimit = costResult.isApproachingLimit;
const isOverLimit = costResult.isOverLimit;
const warnings = costResult.warnings; // Actual backend messages
```

### 3. Real-time Feedback

**Performance Optimizations:**
- Sub-100ms cost calculations with caching
- Optimistic updates for immediate feedback
- Memoization and smart re-rendering
- Debounced API calls for rapid changes

**User Experience:**
- Context-aware warning indicators
- Sticky displays remain visible during scrolling
- Smooth animations and transitions
- Immediate visual feedback

## Component Architecture

### Frontend Components

```
src/frontend/
├── components/
│   ├── WeirdoEditor.tsx           # Main weirdo editing interface
│   ├── WeirdoCostDisplay.tsx      # API-driven cost display with warnings
│   ├── WarbandCostDisplay.tsx     # Warband total with UX warnings
│   ├── ValidationErrorDisplay.tsx # Error message display
│   └── selectors/                 # Equipment/weapon selectors
├── hooks/
│   ├── useCostCalculation.ts      # Centralized cost calculation with caching
│   ├── useItemCost.ts             # Individual item cost calculation
│   ├── useValidation.ts           # Validation with warnings
│   └── useWarband.ts              # Warband state management
└── services/
    ├── apiClient.ts               # Type-safe API client
    ├── apiTypes.ts                # API request/response types
    └── CostCache.ts               # LRU cache for cost calculations
```

**Component Validation Patterns:**
- **WeirdoCostDisplay**: Uses `useCostCalculation` hook for API-driven warnings
- **WarbandCostDisplay**: Uses frontend-defined threshold for warband-level UX
- **All Selectors**: Use `useItemCost` hook for individual item costs
- **No Hardcoded Limits**: Components rely on API-provided validation states

### Backend Services

```
src/backend/
├── routes/
│   └── warbandRoutes.ts           # API endpoint definitions
├── services/
│   ├── ValidationService.ts       # Centralized validation with warnings
│   ├── CostEngine.ts              # Cost calculation engine
│   └── CostModifierStrategy.ts    # Faction ability modifiers
├── models/
│   └── types.ts                   # Shared type definitions
└── constants/
    ├── costs.ts                   # Centralized game constants
    └── validationMessages.ts      # Error/warning messages
```

**Centralized Validation Architecture:**
- **ValidationService**: Single source of truth for all validation logic
- **Constants**: All point limits, thresholds, and rules centralized in `costs.ts`
- **Context-Aware Logic**: Sophisticated warning generation based on warband composition
- **API Integration**: Validation results exposed through `/api/cost/calculate` and `/api/validation/*` endpoints

## Data Flow

### Real-time Cost Calculation

1. **User Input**: User modifies weirdo attributes/equipment
2. **Debounced Hook**: `useCostCalculation` debounces rapid changes
3. **API Request**: POST to `/api/cost/calculate` with weirdo data
4. **Backend Processing**:
   - CostEngine calculates total cost
   - ValidationService generates context-aware warnings
   - Response includes cost breakdown and warnings
5. **Frontend Update**: UI updates with new cost and warning indicators

### Context-Aware Warnings

1. **Warband Analysis**: Backend analyzes existing weirdos in warband
2. **Context Detection**: Determines if 25-point weirdo exists
3. **Applicable Limits**: Calculates which limits apply to current weirdo
4. **Warning Generation**: Generates warnings within 3 points of limits using centralized threshold
5. **Message Formatting**: Creates clear, contextual warning messages from ValidationService
6. **API Response**: Returns warnings with `isApproachingLimit` and `isOverLimit` flags
7. **Frontend Display**: Components use API-driven states without hardcoded logic

**Warning Consistency:**
- **Individual Weirdo Warnings**: Generated by backend ValidationService (3-point threshold)
- **Warband Total Warnings**: Frontend-defined threshold (15 points) for UX feedback
- **No Hardcoded Limits**: Frontend components use API-provided warning states
- **Single Source of Truth**: All business logic centralized in backend constants

## State Management

### Frontend State

- **Local Component State**: Form inputs and UI state
- **Custom Hooks**: Shared state logic (cost calculation, validation)
- **Context API**: Warband-level state when needed
- **No Global Store**: Keeps architecture simple and focused

### Backend State

- **Stateless Services**: All services operate on provided data
- **No Session State**: Each request is independent
- **Immutable Operations**: Services don't modify input data
- **Pure Functions**: Predictable, testable business logic

## Error Handling

### Validation Errors vs Warnings

```typescript
interface ValidationResult {
  valid: boolean,
  errors: ValidationError[],    // Block actions
  warnings: ValidationWarning[] // Inform but don't block
}
```

**Errors (Blocking):**
- Missing required fields
- Invalid attribute values
- Exceeding hard limits
- Rule violations

**Warnings (Non-blocking):**
- Approaching point limits
- Contextual guidance
- Optimization suggestions

### Error Boundaries

- **API Layer**: Consistent error response format
- **Component Level**: Error boundaries for component failures
- **Hook Level**: Error states in custom hooks
- **User Feedback**: Clear, actionable error messages

## Testing Strategy

### Backend Testing

- **Unit Tests**: Individual service methods
- **Property-Based Tests**: Universal properties across all inputs
- **Integration Tests**: API endpoint testing
- **Validation Tests**: Comprehensive rule coverage

### Frontend Testing

- **Component Tests**: UI behavior and rendering
- **Hook Tests**: Custom hook logic
- **Integration Tests**: Component interaction
- **API Mocking**: Isolated frontend testing

## Performance Considerations

### Optimization Strategies

1. **Caching**: Cost calculation results cached by input hash
2. **Memoization**: React.memo and useMemo for expensive operations
3. **Debouncing**: API calls debounced for rapid user input
4. **Lazy Loading**: Components loaded on demand
5. **Bundle Splitting**: Code splitting for optimal loading

### Monitoring

- **Response Times**: API endpoints target <100ms
- **Cache Hit Rates**: Monitor caching effectiveness
- **Error Rates**: Track validation and API errors
- **User Experience**: Monitor warning system effectiveness

## Security Considerations

### Input Validation

- **Type Safety**: TypeScript ensures type correctness
- **Runtime Validation**: Backend validates all inputs
- **Sanitization**: User inputs sanitized before processing
- **Bounds Checking**: All numeric values validated

### API Security

- **CORS**: Configured for frontend domain
- **Rate Limiting**: Consider for production deployment
- **Input Validation**: All API inputs validated
- **Error Handling**: No sensitive information in error messages

## Deployment Architecture

### Development

- **Frontend**: Vite dev server (port 5173)
- **Backend**: Express server (port 3000)
- **Hot Reload**: Both frontend and backend support hot reload
- **Type Checking**: Real-time TypeScript compilation

### Production (Recommended)

- **Frontend**: Static build served by CDN or web server
- **Backend**: Node.js server with process manager (PM2)
- **Reverse Proxy**: Nginx for static files and API routing
- **Database**: Consider adding persistent storage for warbands

This architecture provides a solid foundation for a scalable, maintainable warband builder with intelligent validation and excellent user experience!
