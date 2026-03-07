# Documentation Generation Command

Create comprehensive documentation files for: $ARGUMENTS

## Documentation Strategy

Generate the following documentation for $ARGUMENTS:

Developer Documentation - Technical specs, API details, implementation notes
User Documentation - Simple guide with screenshots placeholders, step-by-step instructions

## Process

- Check for existing documentation
  - Append or reference as appropriate
- Analyze the relevant code files
- Generate two separate files:
  - Developer-facing documentation in `/docs/dev/{feature-name}.ts`
  - User-facing documentation in `/docs/user/{feature-name}.ts`
    - If $ARGUMENTS is not-user facing, do not generate
- Follow our existing documentation standards
- User docs should contain screenshot-placeholders (if screenshot not yet available) when UI-appropriate
- Files should cross-reference each other as appropriate
