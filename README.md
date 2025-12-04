# Space Weirdos Warband Builder

**Version 1.0.0**

A complete web application for creating and managing warbands for the Space Weirdos tabletop game. Built with TypeScript, React, and Express using spec-driven development with formal correctness guarantees.

## Features

- **Complete Warband Management:** Create, edit, save, load, and delete warbands
- **Real-Time Cost Calculation:** Automatic point cost calculation with warband ability modifiers
- **Comprehensive Validation:** Enforces all game rules including point limits, equipment restrictions, and weapon requirements
- **Persistent Storage:** In-memory database with JSON file persistence
- **Intuitive UI:** Three main components for warband list, warband editing, and weirdo customization
- **RESTful API:** Full Express backend with comprehensive endpoints

## Game Rules Implemented

- Warband creation with 75 or 125 point limits
- Leader and trooper customization with 5 attributes (Speed, Defense, Firepower, Prowess, Willpower)
- Close combat and ranged weapon selection
- Equipment limits (2 for leaders, 1 for troopers, +1 with Cyborgs ability)
- Psychic powers (unlimited)
- Leader traits (optional, leader only)
- Warband abilities with cost modifiers (Heavily Armed, Mutants, Soldiers, Cyborgs, etc.)
- Point limit enforcement (20 points for troopers, one 25-point weirdo allowed)

## Testing

**140 tests passing (100% success rate)**

- 25 property-based tests validating correctness properties
- Unit tests for all services and components
- Integration tests for API endpoints
- Frontend component tests with React Testing Library

TypeScript/React/Express application with property-based testing and spec-driven development.

## Technology Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript + Node.js
- **Testing:** Vitest + fast-check
- **Data:** In-memory database with JSON file persistence

## Project Structure

```
├── src/
│   ├── backend/          # Express server
│   └── frontend/         # React application
├── tests/                # Test files
├── data/                 # JSON configuration files
└── .kiro/               # Kiro specs and steering
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Backend: http://localhost:3001
- Frontend: http://localhost:3000

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only property-based tests
npm run test:property
```

### Build

```bash
npm run build
```

## API Endpoints

- `POST /api/warbands` - Create new warband
- `GET /api/warbands` - Get all warbands
- `GET /api/warbands/:id` - Get specific warband
- `PUT /api/warbands/:id` - Update warband
- `DELETE /api/warbands/:id` - Delete warband
- `POST /api/warbands/:id/weirdos` - Add weirdo to warband
- `PUT /api/warbands/:id/weirdos/:weirdoId` - Update weirdo
- `DELETE /api/warbands/:id/weirdos/:weirdoId` - Remove weirdo
- `POST /api/calculate-cost` - Calculate cost for weirdo/warband
- `POST /api/validate` - Validate weirdo/warband

## Spec-Driven Development

This project was built using spec-driven development methodology with formal correctness guarantees.

**Specification Location:** `.kiro/specs/space-weirdos-warband/`

- **requirements.md:** EARS-compliant requirements with INCOSE quality rules (15 requirements, 89 acceptance criteria)
- **design.md:** Complete architecture and design with 25 correctness properties for property-based testing
- **tasks.md:** 14 major tasks with 50+ sub-tasks (all completed)

### Development Process

1. Requirements gathering using EARS patterns
2. Design with correctness properties
3. Task breakdown with property-based test integration
4. Incremental implementation with continuous testing
5. Final validation with 100% test pass rate

## Testing Strategy

- **Unit Tests:** Verify specific examples and edge cases
- **Property-Based Tests:** Verify universal properties across all inputs (minimum 50 iterations)
- Both test types complement each other for comprehensive coverage

## Code Standards

See `.kiro/steering/project-standards.md` for detailed coding standards and conventions.


## Architecture

### Backend Services

- **WarbandService:** Orchestrates warband CRUD operations
- **CostEngine:** Calculates point costs with warband ability modifiers
- **ValidationService:** Enforces all game rules and constraints
- **DataRepository:** In-memory storage with JSON file persistence

### Frontend Components

- **WarbandList:** Displays all saved warbands with load/delete actions
- **WarbandEditor:** Manages warband-level properties and weirdo list
- **WeirdoEditor:** Handles individual weirdo customization

## Changelog

### v1.0.0 (2024-12-03)

**Initial Release**

Complete implementation of the Space Weirdos Warband Builder with all features, comprehensive testing, and formal correctness guarantees.

**Features:**
- Complete warband creation and management system
- Real-time cost calculation with warband ability modifiers
- Comprehensive validation of all game rules
- In-memory database with JSON file persistence
- Full React frontend with three main components
- Express backend with RESTful API

**Testing:**
- 140 tests passing (100% success rate)
- 25 property-based tests validating correctness properties
- Unit tests for all services and components
- Integration tests for API endpoints

**Implementation:**
- Spec-driven development with formal requirements
- EARS-compliant requirements with INCOSE quality rules
- Design with correctness properties for PBT
- Complete task list with all items completed

## License

ISC
