---
inclusion: manual
---

# UI Design System Standards

This file contains mandatory standards for using the CSS-based UI Design System for visual design constants, separate from backend configuration management.

## MANDATORY UI Design Token Usage

### Rule: Use CSS Custom Properties for Visual Design Constants

**All visual design constants (colors, spacing, typography, shadows, etc.) MUST use CSS custom properties in the UI Design System.**

**Location:** `src/frontend/styles/tokens/`

```css
/* ✅ CORRECT - UI design tokens */
:root {
  --color-primary-500: #3b82f6;
  --color-error: #dc2626;
  --spacing-4: 1rem;
  --font-size-lg: 1.125rem;
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --border-radius-md: 0.375rem;
}
```

```css
/* ❌ WRONG - Hard-coded values in component CSS */
.my-component {
  color: #3b82f6;
  padding: 16px;
  font-size: 18px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### UI Design System vs Configuration System

**UI Design System (CSS Custom Properties):**
- Visual appearance constants
- Colors, spacing, typography
- Shadows, borders, animations
- Responsive breakpoints
- Pure CSS implementation
- Runtime theming capability

**Configuration System (ConfigurationManager):**
- Business logic constants
- API settings and behavior
- Cache configuration
- Validation rules and messages
- TypeScript/JavaScript implementation
- Environment variable overrides

## Design Token Categories

### Color Tokens
**Location:** `src/frontend/styles/tokens/colors.css`

```css
:root {
  /* Primary Colors */
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  
  /* Semantic Colors */
  --color-success: #16a34a;
  --color-error: #dc2626;
  --color-warning: #d97706;
  
  /* Text Colors */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-500);
  --color-text-inverse: #ffffff;
}
```

### Spacing Tokens
**Location:** `src/frontend/styles/tokens/spacing.css`

```css
:root {
  /* Spacing Scale - Base unit: 0.25rem (4px) */
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-8: 2rem;      /* 32px */
  
  /* Semantic Spacing */
  --spacing-xs: var(--spacing-1);
  --spacing-sm: var(--spacing-2);
  --spacing-md: var(--spacing-4);
  --spacing-lg: var(--spacing-6);
  --spacing-xl: var(--spacing-8);
}
```

### Typography Tokens
**Location:** `src/frontend/styles/tokens/typography.css`

```css
:root {
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  
  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### Shadow Tokens
**Location:** `src/frontend/styles/tokens/shadows.css`

```css
:root {
  /* Shadow Scale */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Border Tokens
**Location:** `src/frontend/styles/tokens/borders.css`

```css
:root {
  /* Border Radius */
  --border-radius-sm: 0.125rem;  /* 2px */
  --border-radius-md: 0.375rem;  /* 6px */
  --border-radius-lg: 0.5rem;    /* 8px */
  --border-radius-full: 9999px;
  
  /* Border Widths */
  --border-width-0: 0;
  --border-width-1: 1px;
  --border-width-2: 2px;
  --border-width-4: 4px;
}
```

## Usage Patterns

### Component CSS Files

```css
/* ✅ CORRECT - Use design tokens */
.warband-card {
  background-color: var(--color-bg-base);
  border: var(--border-width-1) solid var(--color-border-subtle);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-primary);
}

.warband-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}
```

```css
/* ❌ WRONG - Hard-coded values */
.warband-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  color: #111827;
}
```

### Utility Classes

```css
/* ✅ CORRECT - Utility classes using tokens */
.p-4 { padding: var(--spacing-4); }
.text-primary { color: var(--color-text-primary); }
.bg-primary { background-color: var(--color-primary-500); }
.rounded-md { border-radius: var(--border-radius-md); }
```

### React Components

```tsx
// ✅ CORRECT - Use utility classes and base styles
function WarbandCard({ warband }) {
  return (
    <div className="card p-4 mb-4">
      <h3 className="text-lg font-semibold text-primary">
        {warband.name}
      </h3>
      <p className="text-sm text-secondary mt-2">
        {warband.points} points
      </p>
    </div>
  );
}
```

```tsx
// ❌ WRONG - Inline styles with hard-coded values
function WarbandCard({ warband }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '16px',
      marginBottom: '16px',
      borderRadius: '6px',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>
        {warband.name}
      </h3>
    </div>
  );
}
```

## File Organization

### Token Files Structure

```
src/frontend/styles/tokens/
├── colors.css          # Color palette and semantic colors
├── spacing.css         # Spacing scale and semantic spacing
├── typography.css      # Font sizes, weights, line heights
├── shadows.css         # Shadow tokens for elevation
├── borders.css         # Border radius and widths
├── transitions.css     # Animation timing and easing
├── z-index.css         # Layering tokens
└── breakpoints.css     # Responsive breakpoints
```

### Import Order

```css
/* src/frontend/styles/index.css */

/* 1. Tokens first - defines CSS variables */
@import './tokens/colors.css';
@import './tokens/spacing.css';
@import './tokens/typography.css';
@import './tokens/shadows.css';
@import './tokens/borders.css';
@import './tokens/transitions.css';
@import './tokens/z-index.css';
@import './tokens/breakpoints.css';

/* 2. Base styles - uses tokens */
@import './base/reset.css';
@import './base/buttons.css';
@import './base/forms.css';
@import './base/labels.css';
@import './base/cards.css';

/* 3. Utilities last - can override base styles */
@import './utilities/spacing.css';
@import './utilities/layout.css';
@import './utilities/display.css';
@import './utilities/text.css';
@import './utilities/typography.css';
```

## Naming Conventions

### Token Naming Pattern

```css
--{category}-{variant}-{scale}
--{category}-{semantic-name}
```

**Examples:**
```css
/* Scale-based tokens */
--color-primary-500
--spacing-4
--font-size-lg
--shadow-md

/* Semantic tokens */
--color-text-primary
--color-bg-base
--spacing-xs
--border-radius-md
```

### Semantic vs Scale Tokens

**Scale Tokens (Specific Values):**
```css
--color-blue-500: #3b82f6;
--spacing-4: 1rem;
--font-size-lg: 1.125rem;
```

**Semantic Tokens (Purpose-Based):**
```css
--color-primary: var(--color-blue-500);
--spacing-md: var(--spacing-4);
--font-size-heading: var(--font-size-lg);
```

## Responsive Design

### Breakpoint Tokens

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Usage in Media Queries

```css
@media (min-width: 768px) {
  .responsive-component {
    padding: var(--spacing-8);
    font-size: var(--font-size-xl);
  }
}
```

## Accessibility Considerations

### Color Contrast

```css
:root {
  /* Ensure WCAG AA compliance */
  --color-text-primary: #111827;    /* 4.5:1 on white */
  --color-text-secondary: #6b7280;  /* 4.5:1 on white */
  --color-bg-base: #ffffff;
}
```

### Focus Indicators

```css
:root {
  --color-focus: #3b82f6;
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}

.btn:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus);
  outline-offset: var(--focus-ring-offset);
}
```

### Reduced Motion

```css
:root {
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing UI Design Tokens

### Token Existence Tests

```typescript
// tests/ColorTokens.test.ts
describe('Color Tokens', () => {
  it('should define all primary color tokens', () => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    
    expect(styles.getPropertyValue('--color-primary-500')).toBe('#3b82f6');
    expect(styles.getPropertyValue('--color-error')).toBe('#dc2626');
  });
});
```

### Utility Class Tests

```typescript
// tests/SpacingUtilities.test.ts
describe('Spacing Utilities', () => {
  it('should apply correct spacing values', () => {
    const element = document.createElement('div');
    element.className = 'p-4';
    document.body.appendChild(element);
    
    const styles = getComputedStyle(element);
    expect(styles.padding).toBe('16px'); // 1rem = 16px
  });
});
```

## Code Review Checklist

When reviewing UI code, ensure:

- [ ] No hard-coded colors, spacing, or typography values
- [ ] All visual constants use CSS custom properties from design tokens
- [ ] Proper token naming conventions followed
- [ ] Semantic tokens used where appropriate
- [ ] Accessibility requirements met (contrast, focus indicators)
- [ ] Responsive design considerations included
- [ ] No inline styles with hard-coded values
- [ ] Utility classes used appropriately
- [ ] Component CSS uses design tokens

## Benefits of CSS-Based Design Tokens

1. **Runtime Theming:** Can be changed dynamically without rebuild
2. **Performance:** Native browser feature, zero JavaScript overhead
3. **Cascade Support:** Works naturally with CSS inheritance
4. **Maintainability:** Centralized visual design constants
5. **Consistency:** Enforces design system compliance
6. **Accessibility:** Built-in support for user preferences
7. **Developer Experience:** Clear separation of concerns
8. **Future-Proof:** Easy to extend and modify

## Integration with Configuration System

**Clear Separation:**
- **UI Design Tokens (CSS):** Visual appearance, layout, typography
- **Configuration System (TypeScript):** Business logic, API settings, behavior

**No Overlap:**
- Design tokens handle "how it looks"
- Configuration system handles "how it behaves"
- Both systems work together without conflicts
- Each system optimized for its specific use case

This separation ensures maintainable, performant, and scalable styling while keeping business logic configuration separate and environment-configurable.