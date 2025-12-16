# Steering Files Organization

This directory contains context-specific steering files optimized for token efficiency.

## File Structure

### Always Included (Automatic)

**core-project-info.md**
- Technology stack overview
- Key libraries and frameworks
- Basic code style guidelines
- ~450 tokens

**task-execution-standards.md**
- Task execution guidelines
- Testing strategy and limits
- Token-efficient practices
- File modification limits
- Configuration system requirements
- Test commands and alternatives
- ~2,000 tokens

**Total Always-Included: ~2,450 tokens**

### Manual Inclusion (Use context keys like `#spec-methodology`, `#configuration-standards`)

**spec-methodology.md**
- EARS and INCOSE requirements standards
- Design principles and correctness properties
- Common correctness patterns
- Property-based testing requirements
- ~1,200 tokens

**spec-task-planning.md**
- Task granularity and structure
- Task breakdown criteria
- Implementation/testing separation
- ~800 tokens

**configuration-standards.md**
- Mandatory ConfigurationManager usage
- Environment variable standards
- Migration from legacy constants
- Configuration validation patterns
- ~2,800 tokens

**ui-design-system-standards.md**
- CSS-based design token standards
- UI design system usage patterns
- Visual design constants management
- Separation from backend configuration
- ~2,500 tokens

## Usage Guidelines

### When Creating or Updating Specs

**For requirements and design:**
```
#spec-methodology

I want to create a new feature for user authentication...
```

**For task planning:**
```
#spec-task-planning

Help me break down the implementation tasks...
```

**For complete spec creation:**
```
#spec-methodology #spec-task-planning

I want to create a complete spec for...
```

### When Working with Configuration

**For configuration-related tasks:**
```
#configuration-standards

I need to refactor these magic numbers to use the configuration system...
```

**For tasks involving constants or configuration:**
```
#configuration-standards

Help me implement this feature that needs cost limits and validation messages...
```

### When Working with UI Design

**For UI design system tasks:**
```
#ui-design-system-standards

I need to update the color scheme and spacing in these components...
```

**For tasks involving visual design constants:**
```
#ui-design-system-standards

Help me implement consistent styling using design tokens...
```

### When Executing Tasks
The task execution standards are automatically included. No action needed.

### When Asking General Questions
Only core project info is included automatically, keeping token usage minimal.

## Token Savings

**Before Optimization:**
- Spec creation: ~4,500 tokens (core + task + testing + spec standards)
- Task execution: ~2,500 tokens (core + task + testing)
- General questions: ~500 tokens (core only)

**After Optimization:**
- Spec creation (full): ~4,450 tokens (core + task + methodology + planning)
- Spec creation (requirements/design): ~3,650 tokens (core + task + methodology)
- Spec creation (tasks only): ~3,250 tokens (core + task + planning)
- Configuration tasks: ~5,250 tokens (core + task + configuration-standards)
- UI design tasks: ~4,950 tokens (core + task + ui-design-system-standards)
- Task execution: ~2,450 tokens (core + task)
- General questions: ~450 tokens (core only)

**Token Management:**
- Task execution: **Focused guidance** (2,450 tokens with configuration requirements)
- Spec creation: **Granular control** (save tokens when only specific guidance needed)
- Configuration tasks: **Comprehensive standards** (5,250 tokens for configuration work)
- UI design tasks: **Design system standards** (4,950 tokens for UI design work)
- Context-specific inclusion prevents unnecessary token usage

## Documentation

For detailed project documentation, see the [docs/](../../docs/) directory:

- **[Architecture](../../docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[API Documentation](../../docs/API-DOCUMENTATION.md)** - Backend API reference
- **[Features Guide](../../docs/FEATURES.md)** - Complete feature overview
- **[Warning System](../../docs/WARNING-SYSTEM.md)** - Context-aware warning system guide

## Maintenance

When updating standards:
- **Technology changes**: Update `core-project-info.md`
- **Testing practices**: Update `task-execution-standards.md`
- **Requirements/design methodology**: Update `spec-methodology.md`
- **Task planning patterns**: Update `spec-task-planning.md`
- **Configuration requirements**: Update `configuration-standards.md`
- **UI design system standards**: Update `ui-design-system-standards.md`
- **Documentation structure**: Follow guidelines in `documentation-standards.md`
- Keep files focused and avoid duplication
