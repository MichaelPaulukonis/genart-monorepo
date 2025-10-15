## P5.JS INSTANCE MODE (V1.X): MIGRATION AND REFERENCE SPECIFICATION

This document provides a technical specification for p5.js Instance Mode (version 1.x), focusing on the necessary structure and syntax rules for transitioning code from the default Global Mode to the encapsulated Instance Mode. This structure is mandatory for multi-canvas projects and for avoiding global namespace conflicts.

### I. ARCHITECTURAL CONTEXT: GLOBAL VS. INSTANCE MODE (P5.JS V1.X)

| Execution Mode | Scope Mechanism | Key Characteristics (V1.x) | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Global Mode** (Legacy Default) | All properties and methods are automatically attached to the browser's global `window` object.[1] | Prefix-free function calls (e.g., `createCanvas()`, `line()`). Limited to a single canvas per page.[2] High risk of namespace pollution. | Beginner projects, quick prototyping. |
| **Instance Mode** (Modular Alternative) | All properties and methods are bound exclusively to a specific `p5` object instance.[1] | Requires instance prefix for all API calls (e.g., `p.createCanvas()`). Allows for explicit DOM attachment and multiple canvases.[2] | Complex projects, library integration (e.g., React/Webpack), multiple sketches. |

**Conversion Goal:** To encapsulate sketch logic and variables within a local `p5` object, isolating it from the global scope.

### II. INSTANCE MODE SYNTAX SPECIFICATION (P5.JS V1.X)

The Instance Mode pattern relies on the `p5` constructor and a defining **sketch closure** to manage scope.

#### II.A. The `p5` Constructor [1]

```javascript
p5(sketch, [node])
```

| Parameter | Type | Status | Description |
| :--- | :--- | :--- | :--- |
| **`sketch`** | `Function(p5)` | Mandatory | A closure function that serves as the blueprint for the sketch. It receives the new `p5` instance as its sole argument (conventionally named `p`). This function defines all lifecycle methods and variables.[1] |
| **`[node]`** | `HTMLElement / string (ID)` | Optional | The HTML element ID or a direct DOM node reference where the generated p5 canvas will be attached as a child element. If omitted, the canvas is appended to the document body.[1] |

#### II.B. Sketch Closure Requirement

The sketch closure must assign the required lifecycle functions (`preload()`, `setup()`, `draw()`) as **properties** of the incoming p5 instance object (`p`).

| Global Mode Definition (Legacy) | Instance Mode Definition (Mandatory V1.x) |
| :--- | :--- |
| `function setup() {... }` | `p.setup = function() {... };` |
| `function draw() {... }` | `p.draw = function() {... };` |
| `function mousePressed() {... }` | `p.mousePressed = function() {... };` |

### III. CODE MIGRATION: GLOBAL MODE TO INSTANCE MODE (MANDATORY PREFIXING)

When converting existing code, the single most critical step is applying the instance prefix (`p.`) to **every** p5.js function, variable, and property call.

| API Category | Global Mode (Prefix-Free) | Instance Mode (Prefix Required) | Rule |
| :--- | :--- | :--- | :--- |
| **Setup/Drawing** | `createCanvas(400, 400);` | `p.createCanvas(400, 400);` | All core p5 functions must be prefixed. |
| **System Variables** | `width; height; frameCount;` | `p.width; p.height; p.frameCount;` | Canvas and system properties are bound to the instance object. |
| **Input Variables** | `mouseX; mouseY; keyIsPressed;` | `p.mouseX; p.mouseY; p.keyIsPressed;` | Input variables are properties of the specific instance controlling the canvas. |
| **Utility Functions** | `random(10); map(val, 0, 10, 0, 1);` | `p.random(10); p.map(val, 0, 10, 0, 1);` | Math and utility functions must also be accessed via the instance. |
| **Color/Images** | `loadImage('asset.png'); fill(255);` | `p.loadImage('asset.png'); p.fill(255);` | All asset loading and rendering functions are instance methods. |

### IV. INSTANCE MODE BOILERPLATE AND SCOPE

#### IV.A. Standard Instance Mode Boilerplate (V1.X)

This example demonstrates the correct structure, variable scoping, and instantiation targeting an HTML container element (`<div id="sketch-container"></div>`).

```javascript
// Variable declared outside the closure is TRULY global (SHARED by all instances)
let GLOBAL_COUNTER = 0;

// 1. Define the sketch closure, receiving the instance 'p'
const mySketch = (p) => {
    // Variable declared here is instance-specific (PRIVATE scope)
    let instanceX = 10;
    let circleColor;

    // 2. Define lifecycle methods as properties of 'p'
    p.setup = function() {
        // Use the optional node parameter for attachment
        p.createCanvas(300, 200); 
        p.background(220);
        circleColor = p.color(255, 100, 0); // Use p.color
    };

    p.draw = function() {
        p.fill(circleColor);
        p.circle(instanceX, p.height / 2, 50); // Use p.height, p.circle
        instanceX++;
        GLOBAL_COUNTER++; // Can read/write truly global variables
    };
    
    // Custom function must use 'p.' prefix for p5 API calls
    p.resetSketch = function() {
        instanceX = 10;
        p.redraw();
    }
};

// 3. Instantiate the sketch and attach to a specific DOM element
new p5(mySketch, 'sketch-container');
```

#### IV.B. Variable Scoping Rules for LLM

1.  **Private Instance Variables:** Variables intended to maintain state specific to an instance must be declared using `let` or `const` **inside** the `mySketch` closure but **outside** of `p.setup()` or `p.draw()`. (See `instanceX` in example).
2.  **Global Shared Variables:** Variables declared *outside* the `p5` constructor call and the sketch closure are truly global and accessible/modifiable by all instances and external JS scripts. (See `GLOBAL_COUNTER` in example).

### V. ADVANCED USE CASE: MULTIPLE CANVASES

To run two or more isolated sketches on a single HTML page:

1.  Define a unique HTML container (`div`) for each sketch (e.g., `id="canvas-1"` and `id="canvas-2"`).
2.  Define a separate, unique sketch closure function for each canvas (e.g., `sketchA` and `sketchB`).
3.  Instantiate each sketch separately, pointing to its respective container ID.[2]

<!-- end list -->

```javascript
// Sketch A: Draws circles on canvas-1
const sketchA = (p) => { 
    p.setup = function() { p.createCanvas(200, 200); }
    p.draw = function() { p.background(255, 0, 0); p.circle(p.mouseX, p.mouseY, 20); }
};

// Sketch B: Draws squares on canvas-2
const sketchB = (p) => { 
    p.setup = function() { p.createCanvas(200, 200); }
    p.draw = function() { p.background(0, 0, 255); p.square(p.mouseX, p.mouseY, 20); }
};

new p5(sketchA, 'canvas-1'); // Instance A attached to 'canvas-1'
new p5(sketchB, 'canvas-2'); // Instance B attached to 'canvas-2'
```

**Isolation Principle:** The `p.mouseX` in `sketchA` is independent of the `p.mouseX` in `sketchB`. Each instance is self-contained.