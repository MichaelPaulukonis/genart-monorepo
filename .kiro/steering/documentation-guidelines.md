---
description: Guidelines for creating concise, practical documentation
alwaysApply: true
---

# Documentation Guidelines

## Core Principles

- **Concise over comprehensive** - Aim for <200 lines for most documents
- **Practical over theoretical** - Focus on what users actually need to do
- **Essential over exhaustive** - Document only what's necessary

## Documentation Limits

### File Size Limits
- **Deployment guides**: <200 lines total
- **API documentation**: <300 lines per endpoint group
- **Setup guides**: <150 lines
- **Troubleshooting**: <100 lines

### Avoid Over-Engineering
- **No incident response docs** for minor features like UI styling
- **No comprehensive checklists** for simple deployment processes
- **No emergency procedures** for non-critical systems
- **No monitoring dashboards** for basic validation scripts

## What NOT to Document

### Skip These for Minor Features
- Incident response procedures
- Comprehensive deployment checklists
- Emergency escalation procedures
- Detailed monitoring and alerting
- Post-incident review processes

### Version Display Example
Version display is a minor UI feature. It does NOT need:
- ❌ Incident response procedures
- ❌ Emergency rollback scripts
- ❌ Comprehensive monitoring
- ❌ Escalation procedures
- ❌ Post-deployment analysis

It DOES need:
- ✅ Basic deployment steps
- ✅ Simple rollback procedure
- ✅ Validation commands

## Documentation Structure

### Keep It Simple
```markdown
# Feature Name

## Quick Start
[Essential commands only]

## Common Issues
[Top 3 problems and solutions]

## Reference
[Command list]
```

### Avoid Complex Structures
- No multi-level hierarchies
- No cross-references between multiple docs
- No comprehensive procedure matrices
- No detailed workflow diagrams

## Token Conservation

- **Minimize generated content** - Each line of documentation uses tokens
- **Focus on user value** - Don't document for completeness sake
- **Prefer existing tools** - Use built-in validation over custom scripts
- **Consolidate information** - One document per feature, not multiple

## Review Questions

Before creating documentation, ask:
1. Is this feature critical enough to warrant detailed docs?
2. Will users actually read more than 200 lines?
3. Can this be simplified to essential commands only?
4. Does this duplicate existing documentation?

If any answer is "no", simplify or skip the documentation.