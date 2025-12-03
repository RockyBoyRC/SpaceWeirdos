# Project Standards

This steering file contains standards and conventions for this project.

## Overview

This project follows spec-driven development methodology to build features systematically with formal correctness guarantees.

## Technology Stack

### Frontend
- **Language:** TypeScript
- **Framework:** React
- **Purpose:** Web interface for user interaction

### Backend
- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Purpose:** Business logic, in-memory database, JSON file I/O

### Data Storage
- **In-Memory Database:** JavaScript objects, Maps, and Sets
- **Persistence:** JSON files on local filesystem
- **Configuration:** JSON files for user settings and application parameters

### Testing
- **Unit Testing:** Jest or Vitest
- **Property-Based Testing:** fast-check (minimum 50 iterations per test)
- **Test Location:** Co-located with source files using `.test.ts` suffix

### Key Libraries
- **File I/O:** Node.js `fs` module (promises API)
- **JSON Handling:** Native `JSON.parse()` and `JSON.stringify()`
- **HTTP Server:** Express.js

## Documentation

- Document public APIs and interfaces
- Keep README files up to date
- Include examples where helpful

## Requirements Standards

All requirements must follow EARS (Easy Approach to Requirements Syntax) patterns:
- **Ubiquitous**: THE <system> SHALL <response>
- **Event-driven**: WHEN <trigger>, THE <system> SHALL <response>
- **State-driven**: WHILE <condition>, THE <system> SHALL <response>
- **Unwanted event**: IF <condition>, THEN THE <system> SHALL <response>
- **Optional feature**: WHERE <option>, THE <system> SHALL <response>

Requirements must also comply with INCOSE quality rules:
- Use active voice
- Avoid vague terms
- Be measurable and testable
- Use consistent terminology
- Focus on what, not how

## Design Principles

Designs must include:
- Clear architecture and component boundaries
- Correctness properties for property-based testing
- Each property must start with "For any..." (universal quantification)
- Properties must reference specific requirements they validate

## Code Style

- Use clear, descriptive variable and function names
- Follow TypeScript and React best practices
- Keep functions focused and single-purpose
- Add comments for complex logic
- Use async/await for asynchronous operations
- Prefer functional programming patterns where appropriate
- Use proper TypeScript types (avoid `any`)
- Follow ESLint and Prettier configurations

## Version Control

- Write clear, descriptive commit messages
- Keep commits focused on single changes
- Review changes before committing

## Testing Strategy

- Write tests for new functionality
- Ensure tests are maintainable and readable

Use dual testing approach:
- **Unit tests**: Verify specific examples and edge cases
- **Property-based tests**: Verify universal properties across all inputs

Both test types complement each other and are required for comprehensive coverage.

### Property-Based Testing Requirements

- Configure each property-based test to run a minimum of **50 iterations**
- Tag each property-based test with a comment linking it to the design document
- Use this exact format: `**Feature: {feature_name}, Property {number}: {property_text}**`
- Example: `**Feature: user-auth, Property 1: Round trip consistency**`
- Each correctness property from the design document must be implemented by a single property-based test
- Property tests should use smart generators that constrain inputs to valid ranges

## Implementation

Tasks should:
- Build incrementally on previous work
- Reference specific requirements
- Include property-based tests alongside implementation
- Focus only on coding activities (no deployment, user testing, etc.)