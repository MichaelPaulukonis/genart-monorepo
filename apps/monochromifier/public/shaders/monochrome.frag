precision highp float;

varying vec2 vTexCoord;

uniform sampler2D uTexImage;
uniform sampler2D uTexPaint;
uniform vec2 uTexSize;
uniform float uThreshold;
uniform bool uInvert;
uniform vec3 uBackgroundColor;
uniform bool uTransparencyMode;
uniform float uTransparencyThreshold;
uniform int uColorMode;       // 0=avg, 1=red, 2=green, 3=blue, 4=luminance, 5=custom
uniform vec3 uChannelWeights; // used when uColorMode == 5

// --- Color-mode helpers ---

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Returns the processed color vec3.
// For grayscale modes (1-5) all components are equal.
// For mode 0 (full color pass) returns the original RGB.
vec3 applyColorMode(vec3 color) {
  if (uColorMode == 1) return vec3(color.r);
  if (uColorMode == 2) return vec3(color.g);
  if (uColorMode == 3) return vec3(color.b);
  if (uColorMode == 4) return vec3(luminance(color));
  if (uColorMode == 5) return vec3(dot(color, uChannelWeights));
  return color; // mode 0: full color pass (average used downstream)
}

void main() {
  // Snap UV coordinates to the center of the nearest pixel to avoid
  // linear interpolation artifacts at texture boundaries.
  // We clamp to a tiny inset to ensure we never hit the exact edge where wrap modes kick in.
  vec2 clampedUV = clamp(vTexCoord, 0.0, 0.999999);
  vec2 pixel = clampedUV * uTexSize;
  vec2 snapped = floor(pixel) + 0.5;
  vec2 uv = snapped / uTexSize;

  // Sample source image and paint layer
  vec4 imgColor = texture2D(uTexImage, uv);
  vec4 paintColor = texture2D(uTexPaint, uv);

  // 1. Apply color mode, then reduce to a single gray value for the B&W pipeline.
  //    For grayscale modes the three components are equal so dot(v, 1/3) == v.r.
  //    For mode 0 (full color) dot(rgb, 1/3) gives the simple average — matching
  //    the original behaviour.
  vec3 processed = applyColorMode(imgColor.rgb);
  float gray = dot(processed, vec3(1.0 / 3.0));

  // 2. Apply threshold
  float bw = gray > uThreshold ? 1.0 : 0.0;

  // 3. Apply Invert
  if (uInvert) {
    bw = 1.0 - bw;
  }

  // 4. Determine final base color (black or white)
  vec4 finalColor;

  if (uTransparencyMode) {
    // Transparency Mode: White pixels become transparent, Black stay black
    // White is bw = 1.0 (or 0.0 if inverted? No, bw is normalized 0.0 or 1.0)
    // Current JS logic: shouldBeTransparent = bw >= 255 - transparencyThreshold
    float transparencyLimit = (255.0 - uTransparencyThreshold) / 255.0;

    if (bw >= transparencyLimit || imgColor.a == 0.0) {
      finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  } else {
    // Standard Mode: Replace "white/transparent" with background color
    if (imgColor.a == 0.0 || bw == (uInvert ? 0.0 : 1.0)) {
      finalColor = vec4(uBackgroundColor, 1.0);
    } else {
      float val = uInvert ? 1.0 : 0.0;
      finalColor = vec4(val, val, val, 1.0);
    }
  }

  // 5. Composite Paint Layer on top
  // Unpremultiply paint color: canvas2d backing store uses premultiplied alpha,
  // so edge pixels arrive as (R*a, G*a, B*a, a) instead of (R, G, B, a).
  // Without unpremultiplying, semi-transparent stroke edges appear much darker (black halos).
  vec4 paint;
  if (paintColor.a > 0.0001) {
    paint = vec4(paintColor.rgb / paintColor.a, paintColor.a);
  } else {
    paint = vec4(0.0);
  }

  if (uTransparencyMode) {
    // In transparency mode, white paint = transparent (same rule as white pixels).
    // Blend toward transparent so painted areas export as transparent, not opaque white.
    gl_FragColor = mix(finalColor, vec4(0.0, 0.0, 0.0, 0.0), paint.a);
  } else {
    gl_FragColor = mix(finalColor, vec4(paint.rgb, 1.0), paint.a);
  }
}
