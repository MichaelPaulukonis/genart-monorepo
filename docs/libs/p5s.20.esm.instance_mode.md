## P5.JS INSTANCE MODE: ARCHITECTURAL MANDATE & REFERENCE GUIDE

### I. CORE MANDATE: P5.JS 2.0 AND ESM

The transition of p5.js to full **ECMAScript Module (ESM)** support in version 2.0 transforms Instance Mode from an optional feature into the **mandatory standard** for contemporary p5.js development.[1]

| Mode | p5.js v1.x Status | p5.js v2.0 (ESM) Status | Architectural Reason |
| :--- | :--- | :--- | :--- |
| **Global Mode** (Legacy) | Default, easy for beginners.[2] | Not supported in pure ESM context.[1] | ES Modules enforce strict encapsulation, preventing p5 functions from attaching to the global `window` object.[1] |
| **Instance Mode** (Standard) | Advanced option for isolation/multi-canvas.[2] | **Mandatory** when using `import` statements.[1] | Explicit instantiation (`new p5(sketch)`) binds all p5 methods to a local context object (`p`), resolving module scope conflicts.[3, 4] |

### II. STANDARD IMPLEMENTATION: ESM BOILERPLATE

All p5.js 2.0 sketches using ESM must follow the instance mode pattern, which requires the definition of a sketch closure and the manual creation of a new `p5` instance.[1]

#### II.A. Standard Boilerplate (ESM/Instance Mode)

```javascript
import p5 from 'p5'; // Load p5 class constructor

// 1. Identify the container element (recommended best practice)
const containerElement = document.getElementById('p5-container-id');

// 2. Define the sketch closure (the blueprint function)
const mySketchFunction = (p) => {
    // Variables declared here are private to this instance (closure)

    // A. Lifecycle functions must be defined as properties of 'p'
    p.preload = function() { /* Asynchronous asset loading */ };
    p.setup = function() {
        // B. All p5 functions must be prefixed with 'p.'
        p.createCanvas(800, 400); [4]
    };
    p.draw = function() {
        p.background(0); [4]
        p.fill(255);
        p.rect(p.mouseX, p.mouseY, 50, 50); // p.mouseX/Y are instance properties
    };
    
    // C. Event functions (e.g., p.mousePressed) are also methods of 'p'
};

// 3. Instantiate the sketch
new p5(mySketchFunction, containerElement); [3, 4]
```

#### II.B. P5 Constructor Parameters

| Parameter | Type | Status | Description |
| :--- | :--- | :--- | :--- |
| **`sketch`** | `Function(p5)` | Mandatory | A closure function that receives the new p5 instance (`p`) as its sole argument and assigns the required `preload()`, `setup()`, and/or `draw()` methods to it.[3] |
| **`[node]`** | `HTMLElement / string (ID)` | Optional | The HTML element ID or DOM node to which the generated p5 canvas will be attached. Explicit attachment is best practice for complex layouts.[3] |

### III. INSTANCE MODE USE CASES

#### III.A. Multiple Canvases

Instance Mode is the only method for running "multiple canvases on the same page" without conflicts.[2]

  * **Technique:** Define two separate sketch closures (`sketch1`, `sketch2`) and instantiate them with separate `new p5()` calls, each targeting a unique HTML container ID.[2]
    ```javascript
    new p5(sketch1, 'canvas-A');
    new p5(sketch2, 'canvas-B');
    ```
  * **Isolation:** Each instance manages its own state, lifecycle (`p.setup`, `p.draw`), and variables (e.g., `p.mouseX` is relative to that instance's canvas).[2]

#### III.B. Integration and Modularity

Instance Mode is critical for integration into larger JavaScript applications and frameworks (e.g., Webpack, React).[4]

  * **Mechanism:** Encapsulation prevents "global namespace pollution," where p5.js functions conflict with other library functions.[2]
  * **DOM Access:** P5.js DOM functions (e.g., `createP()`, `createButton()`) must be accessed via the instance (`p.createP()`) and are attached as children to the DOM node specified during instantiation.[3]

### IV. P5.JS 2.0 ARCHITECTURAL CHANGES

The shift to 2.0, driven by community input and the ESM mandate, includes specific changes impacting the Instance Mode API and project development:

  * **API Function Removals:** Functions that duplicate functionality already supported by native JavaScript are being removed to simplify maintenance (fewer bugs, faster fixes). These removals are listed in a compatibility guide.[5]
  * **Table API Retention:** Data structure functions, specifically the Table API, will remain in p5.js 2.0 as community feedback indicated no adequate native JavaScript alternative.[5]
  * **New Features:** New capabilities such as variable fonts, `async/await` for asynchronous loading, and `textToContours()` are integrated into the Instance Mode structure.[6]
  * **Global Mode Debate:** An active discussion is pending regarding an optional enhancement to allow a global-like experience (attaching instance functions to `window`) even with ESM, specifically for educational accessibility. However, this is not the architectural default.[1]
  * **Timeline:** A Release Candidate (RC) phase is underway. The official p5.js Editor is scheduled to default to p5.js 2.0 in **August 2026**.[5, 7]

### V. COMMON ERRORS AND TROUBLESHOOTING

| Issue/Error Message | Cause | Solution |
| :--- | :--- | :--- |
| `Cannot read properties of undefined (reading 'background')` | Forgetting to prefix a p5 function/variable with the instance parameter (e.g., `background()` instead of `p.background()`).[4] | **Mandatory Fix:** Systematically prefix *all* p5 function and variable calls with the instance name (`p.`). |
| Sketch canvas does not appear, or appears in the wrong location. | The `[node]` parameter was omitted, or the provided HTML element ID is incorrect or non-existent.[3] | Ensure the second argument to `new p5()` is a valid HTML ID string or DOM node reference, and that the element exists in the HTML.[3] |
| Sketch functions (`setup`, `draw`) are not called. | The core functions were not assigned as properties of the instance (e.g., `function setup()` instead of `p.setup = function() {...}`).[4] | Ensure `p.setup`, `p.draw`, etc., are defined as methods/properties of the instance object `p` within the sketch closure.[4] |
| Conflicts with external libraries (e.g., Webpack, React). | Using legacy Global Mode (v1.x) or improper variable declaration.[4] | Instance Mode is the solution: it provides namespacing, isolating the p5 sketch from other library namespaces.[2] |

### VI. GLOSSARY

| Term | Definition |
| :--- | :--- |
| **Instance** | A specific object created from the `p5` class constructor, containing its own isolated set of p5 methods and properties.[3] |
| **Instance Mode** | The structural pattern requiring all p5 API access (functions and variables) to be bound to a local instance object (e.g., `p.line()`).[2] |
| **Sketch Closure** | The function passed to `new p5()` that encapsulates all the sketch's logic and lifecycle methods.[3] |
| **ESM (ECMAScript Modules)** | The standardized JavaScript module system using `import` and `export`. Its strict scope rules mandate the use of Instance Mode in p5.js 2.0.[1] |
| **Namespace** | A distinct logical grouping of identifiers (variables, functions) to prevent naming conflicts. Instance Mode provides local namespacing.[2] |
| **`p`** | The conventional variable name used for the p5 instance argument within the sketch closure, serving as the required API prefix.[2] |