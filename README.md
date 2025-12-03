# Space Weirdos

TypeScript/React/Express application with property-based testing.

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

## Spec-Driven Development

This project follows spec-driven development methodology. See `.kiro/specs/` for feature specifications.

To create a new feature:
1. Define requirements in `.kiro/specs/{feature}/requirements.md`
2. Create design with correctness properties in `design.md`
3. Break down into tasks in `tasks.md`
4. Execute tasks one at a time

## Testing Strategy

- **Unit Tests:** Verify specific examples and edge cases
- **Property-Based Tests:** Verify universal properties across all inputs (minimum 50 iterations)
- Both test types complement each other for comprehensive coverage

## Code Standards

See `.kiro/steering/project-standards.md` for detailed coding standards and conventions.
