# Size Control Unit Tests

This file contains unit tests for the size control functionality in the duo-chrome interactive controls feature.

## Test Coverage

The tests cover the following requirements from the specification:

### Requirement 1.3 - Minimum Scale Enforcement
- Tests that the system enforces a minimum scale factor of 0.05
- Verifies that attempts to go below minimum are prevented
- Ensures proper feedback is provided when minimum is reached

### Requirement 1.4 - Maximum Scale Enforcement  
- Tests that the system enforces a maximum scale factor of 5.0
- Verifies that attempts to go above maximum are prevented
- Ensures proper feedback is provided when maximum is reached

### Requirement 1.5 - Scale Clamping Logic
- Tests increment/decrement behavior with various delta values
- Verifies proper handling of edge cases at boundaries
- Tests precision and rounding behavior
- Validates state management during size adjustments

## Test Categories

### Bounds Enforcement Tests
- Minimum scale limit enforcement
- Maximum scale limit enforcement
- Exact boundary conditions
- Near-boundary conditions

### Increment/Decrement Tests
- Positive delta increments
- Negative delta decrements
- Large delta values
- Zero delta handling
- Multiple small increments

### Edge Case Tests
- Invalid image indices
- Decimal precision handling
- State management verification
- Independent image control

## Running the Tests

### Using npm/pnpm
```bash
cd apps/duo-chrome
npm run test:size-control
# or
pnpm test:size-control
```

### Using nx
```bash
nx test duo-chrome
```

### Direct execution
```bash
node apps/duo-chrome/src/size-control.test.js
```

## Test Implementation

The tests use a minimal testing framework built into the test file itself, with:
- Mock p5.js environment
- Mock console for logging
- Mock audio context for feedback
- Assertion utilities (assertEqual, assertTrue, etc.)
- Test runner with pass/fail reporting

## Test Results

All 16 tests should pass, covering:
- ✓ Bounds enforcement (minimum and maximum)
- ✓ Increment/decrement behavior
- ✓ Edge case handling
- ✓ State management
- ✓ Precision and rounding
- ✓ Invalid input handling

The tests validate that the size control system correctly implements the requirements for interactive image scaling with proper bounds checking and user feedback.