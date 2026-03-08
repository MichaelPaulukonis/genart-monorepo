/**
 * WebGLProcessor handles p5.js WEBGL rendering and shader management.
 */
export class WebGLProcessor {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.buffer = p.createGraphics(width, height, p.WEBGL);
    this.buffer.noSmooth(); // Use NEAREST filtering to avoid edge artifacts
    this.shader = null;
    this.isReady = false;
  }

  async init(vertPath, fragPath) {
    return new Promise((resolve) => {
      this.shader = this.p.loadShader(vertPath, fragPath, () => {
        this.isReady = true;
        console.log('Shader loaded successfully');
        resolve(true);
      });
    });
  }

  updateSize(w, h) {
    if (this.width !== w || this.height !== h) {
      this.width = w;
      this.height = h;
      this.buffer.resizeCanvas(w, h);
      this.buffer.noSmooth(); // Re-apply after resize
    }
  }

  process(state, img) {
    if (!this.isReady || !this.shader) return;

    // Ensure buffer matches image size to avoid stretching and scaling issues
    this.updateSize(img.width, img.height);

    const b = this.buffer;
    b.clear();
    b.noStroke(); // Ensure no default black border is drawn
    b.shader(this.shader);

    // Set uniforms
    this.shader.setUniform('uTexImage', img);
    this.shader.setUniform('uTexPaint', state.paintLayer);
    this.shader.setUniform('uTexSize', [img.width, img.height]);
    this.shader.setUniform('uThreshold', state.threshold / 255.0);
    this.shader.setUniform('uInvert', state.invert);
    this.shader.setUniform('uTransparencyMode', state.transparencyModeEnabled);
    this.shader.setUniform('uTransparencyThreshold', state.transparencyThreshold);
    
    // Normalize background color
    const bg = state.backgroundColor;
    this.shader.setUniform('uBackgroundColor', [
      this.p.red(bg) / 255.0,
      this.p.green(bg) / 255.0,
      this.p.blue(bg) / 255.0
    ]);

    // Draw a rectangle covering the full buffer to trigger the shader.
    // In p5 WEBGL mode, rect is drawn relative to center (0,0).
    b.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    return b;
  }

  /**
   * Reads pixels from the WebGL buffer. 
   * Note: This is a synchronous operation and can be a bottleneck.
   */
  getProcessedPixels() {
    if (!this.isReady) return null;
    this.buffer.loadPixels();
    return this.buffer.pixels;
  }

  destroy() {
    if (this.buffer) {
      this.buffer.remove();
    }
  }
}
