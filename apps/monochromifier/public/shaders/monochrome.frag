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

  // 1. Convert source to grayscale
  float avg = (imgColor.r + imgColor.g + imgColor.b) / 3.0;

  // 2. Apply threshold
  float bw = avg > uThreshold ? 1.0 : 0.0;

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
