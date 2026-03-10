/**
 * WebGLProcessor handles p5.js WEBGL rendering and shader management.
 */
export class WebGLProcessor {
  constructor(p, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.buffer = p.createGraphics(width, height, p.WEBGL);
    this.buffer.noSmooth();
    this.shaders = {};
    this.isReady = false;
  }

  /**
   * Initializes multiple shaders.
   * @param {Object} shaderConfigs - e.g. { monochrome: { vert, frag }, halftone: { vert, frag } }
   */
  async init(shaderConfigs) {
    const promises = Object.entries(shaderConfigs).map(([name, paths]) => {
      return new Promise((resolve) => {
        this.p.loadShader(paths.vert, paths.frag, (s) => {
          this.shaders[name] = s;
          console.log(`Shader '${name}' loaded successfully`);
          resolve();
        });
      });
    });

    await Promise.all(promises);
    this.isReady = true;
    return true;
  }

  updateSize(w, h) {
    if (this.width !== w || this.height !== h) {
      this.width = w;
      this.height = h;
      this.buffer.resizeCanvas(w, h);
      this.buffer.noSmooth();
    }
  }

  process(state, img) {
    if (!this.isReady) return;

    // Determine which shader to use
    const shaderName = state.halftone?.enabled ? 'halftone' : 'monochrome';
    const activeShader = this.shaders[shaderName];
    
    if (!activeShader) return;

    // Ensure buffer matches image size
    this.updateSize(img.width, img.height);

    const b = this.buffer;
    b.clear();
    b.noStroke();
    b.shader(activeShader);

    // Common Uniforms
    activeShader.setUniform('uTexImage', img);
    activeShader.setUniform('uTexPaint', state.paintLayer);
    activeShader.setUniform('uTexSize', [img.width, img.height]);
    activeShader.setUniform('uThreshold', state.threshold / 255.0);
    activeShader.setUniform('uInvert', state.invert);
    activeShader.setUniform('uTransparencyMode', state.transparencyModeEnabled);
    activeShader.setUniform('uTransparencyThreshold', state.transparencyThreshold);
    activeShader.setUniform('uColorMode', state.colorMode ?? 0);
    activeShader.setUniform('uChannelWeights', state.channelWeights ?? [1.0, 0.0, 0.0]);
    
    const bg = state.backgroundColor;
    activeShader.setUniform('uBackgroundColor', [
      this.p.red(bg) / 255.0,
      this.p.green(bg) / 255.0,
      this.p.blue(bg) / 255.0
    ]);

    // Halftone-specific Uniforms
    if (shaderName === 'halftone') {
      activeShader.setUniform('uPatternType', state.halftone.patternType);
      activeShader.setUniform('uDotSize', state.halftone.dotSize);
      // Convert degrees to radians
      activeShader.setUniform('uAngle', (state.halftone.angle || 0) * (Math.PI / 180.0));
    }

    b.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    return b;
  }

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
