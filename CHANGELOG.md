# Changelog

All notable changes to the Space Weirdos Warband Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2024-12-13

### Added - Major Visual Overhaul & New Features
- **Vintage Space Monster Theme**: Complete visual transformation with retro sci-fi horror aesthetic
- **Warband Cloning**: New ability to duplicate existing warbands with confirmation dialog
- **Weirdo Duplication**: Clone individual weirdos within warbands
- **Learn About Integration**: In-app "Learn About Space Weirdos" feature with README content system
- **Dramatic UI Elements**: Scanline overlays, noise textures, animated monster eye, and pulsing alerts
- **Sci-Fi Typography**: New font system using Bebas Neue, Rubik Mono One, and Creepster fonts

### Changed - User Experience Improvements
- **Button Terminology**: Changed "Duplicate" to "Clone" throughout the application
- **Visual Design**: Complete theme overhaul with high-contrast black/white/cream color palette and red accents
- **Header Branding**: Updated from "My Warbands" to "Invasion Protocol - Warband Command Center"
- **Button Layout**: Centered Learn About and Create Warband buttons for better visual balance
- **Button Sizing**: Reduced padding on warband action buttons (Edit, Clone, Delete) for more compact design
- **Typography**: Increased letter spacing and removed glow effects for improved legibility
- **Alert Messages**: Updated empty states and error messages with sci-fi themed text

### Technical Improvements
- **Design System**: Comprehensive CSS custom properties for colors, typography, and spacing
- **Animation System**: CSS-only animations with GPU acceleration and reduced motion support
- **Content Management**: Dynamic README loading with caching and fallback systems
- **Error Handling**: Robust error boundaries and user feedback throughout
- **Accessibility**: Maintained WCAG AA compliance with improved focus indicators

### Previous Releases
- Context-aware warning system with intelligent thresholds
- Frontend-backend API separation with type-safe client
- Real-time cost calculation with sub-100ms performance
- Comprehensive Space Weirdos game rule validation

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
