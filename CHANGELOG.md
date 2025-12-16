# Changelog

All notable changes to the Space Weirdos Warband Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.0] - 2024-12-15

### Added
- **Centralized Configuration Management System** with ConfigurationManager singleton
- **Environment-Specific Configuration** with automatic detection and optimization
- **Comprehensive Configuration Validation** with detailed error messages and fallback recovery
- **Environment Variable Support** for all configuration values with automatic type conversion
- **Configuration Sections** for Server, API, Cache, Cost, Validation, Environment, and File Operations
- **Advanced Error Handling** with configuration-specific error classes and detailed validation
- **Performance Optimizations** with environment-specific cache TTLs and settings
- **Configuration Examples** for development, production, and test environments

### Changed
- **Migrated from Legacy Constants** to centralized configuration system
- **Replaced hardcoded values** with ConfigurationManager-managed configuration
- **Enhanced cache management** with configuration-driven cache factory
- **Improved environment detection** with intelligent fallback behavior
- **Updated all services** to use centralized configuration instead of constants
- **Modernized configuration architecture** with type-safe access patterns

### Removed
- **Legacy constant files**: `src/backend/constants/costs.ts` and `src/backend/constants/validationMessages.ts`
- **Hardcoded configuration values** throughout the application
- **Manual cache configuration** in favor of configuration-managed caches

### Technical Details
- **ConfigurationManager**: Singleton class providing centralized, type-safe configuration access
- **Environment-Specific Overrides**: Automatic configuration optimization based on NODE_ENV
- **Comprehensive Validation**: Type checking, range validation, and format validation for all configuration values
- **Fallback Recovery**: Graceful degradation with fallback mechanisms for critical configuration failures
- **Migration Support**: Backward compatibility during transition from legacy constants
- **Performance Tuning**: Environment-specific cache TTLs and performance optimizations

### Breaking Changes
- **Configuration System Migration**: All direct constant imports must be replaced with ConfigurationManager usage
- **Environment Variables**: New required environment variables for production deployment
- **Service Constructors**: Updated to use configuration-managed values instead of hardcoded constants

## [1.7.0] - 2024-12-10

### Added
- Context-aware warning system that adapts to warband composition
- Intelligent warning thresholds (within 3 points of applicable limits)
- Backend ValidationService integration for consistent warning generation
- Premium weirdo slot messaging for 25-point limit warnings
- Comprehensive test suite for warning logic scenarios

### Changed
- Warning threshold reduced from 10 points to 3 points for more precise feedback
- Warning logic now considers whether a 25-point weirdo already exists in the warband
- Frontend now uses backend-generated warnings instead of hardcoded calculations
- ValidationService now returns ValidationResult with both errors and warnings
- Updated all documentation to reflect new warning system functionality

### Technical Details
- Updated `ValidationService.generateWeirdoCostWarnings()` with context-aware logic
- Modified `ValidationResult` interface to include `warnings: ValidationWarning[]`
- Enhanced API endpoints to return warning information
- Added comprehensive test coverage for all warning scenarios
- Updated 89 existing tests to work with new ValidationResult structure

## Previous Releases

### Frontend-Backend API Separation
- Implemented clean separation between frontend and backend
- Added dedicated API layer with type-safe client
- Consistent error handling and response structures

### Real-time Feedback Polish
- Sub-100ms cost calculations with caching
- Sticky cost displays that remain visible while scrolling
- Optimistic updates for seamless user interaction
- Warning indicators for approaching limits

### Core Features
- Comprehensive Space Weirdos game rule validation
- Real-time cost calculation with faction modifiers
- Warband management with 75/125 point limits
- Equipment, weapon, and psychic power selection
- Leader trait system
- Responsive design for desktop and mobile
