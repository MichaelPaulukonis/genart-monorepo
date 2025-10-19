import '../css/style.css'
import p5 from 'p5'
import { AboutDialog } from './AboutDialog.js'

// inspired by work of https://bsky.app/profile/leedoughty.bsky.social

const palettes = [
  'https://coolors.co/palette/00ffff-00ff15-ffff00-ff9500-ff0040-ff00ff', // too bright maybe
  'https://coolors.co/palette/04e762-f5b700-008bf8-89fc00-f4442e', // bright green red thing
  'https://coolors.co/palette/ffc759-ff7b9c-607196-babfd1-e8e9ed', // gray-yellow-red pastel
  'https://coolors.co/palette/81f4e1-56cbf9-ff729f-d3c4d1', // blue-green pastels
  'https://coolors.co/palette/cfd4c5-eecfd4-efb9cb-e6adec-c287e8', // rose-purplish pastels
  'https://coolors.co/palette/f5ffc6-b4e1ff-ab87ff-fface4-c1ff9b', // purplish pastels
  'https://coolors.co/palette/70d6ff-ff70a6-ff9770-ffd670-e9ff70', // light reddish pastels
  'https://coolors.co/palette/f72585-b5179e-7209b7-560bad-480ca8-3a0ca3-3f37c9-4361ee-4895ef-4cc9f0', // bluesish
  'https://coolors.co/palette/9b5de5-f15bb5-fee440-00bbf9-00f5d4', // bright pastels
  'https://coolors.co/palette/0b090a-161a1d-660708-a4161a-ba181b-e5383b-b1a7a6-d3d3d3-f5f3f4', // reds
  'https://coolors.co/palette/007f5f-2b9348-55a630-80b918-aacc00-bfd200-d4d700-dddf00-eeef20-ffff3f', // spring green & yellow
  'https://coolors.co/palette/00296b-003f88-00509d-fdc500-ffd500', // Blue & Yellow
  'https://coolors.co/palette/004b23-006400-007200-008000-38b000-70e000-9ef01a-ccff33', // Emerald City
  'https://coolors.co/palette/ff6d00-ff7900-ff8500-ff9100-ff9e00-240046-3c096c-5a189a-7b2cbf-9d4edd', // purple-orange
  'https://coolors.co/palette/004733-2b6a4d-568d66-a5c1ae-f3f4f6-dcdfe5-df8080-cb0b0a-ad080f-8e0413', // red-green technicolor
  'https://coolors.co/palette/fbf8cc-fde4cf-ffcfd2-f1c0e8-cfbaf0-a3c4f3-90dbf4-8eecf5-98f5e1-b9fbc0', // pale
]

// Initialize AboutDialog
const aboutDialog = new AboutDialog()

// Create P5 instance with a function that receives the p5 instance
// eslint-disable-next-line no-new
new p5((p) => {
  const dashes = [[2], [5], [10], [30], [5, 10, 30, 10]]

  // Add background state variable
  let isBlackBackground = false;

  const overlays = [
    drawCircleTile,
    drawRotatedCrossTile,
    drawRadialLinesTile,
    drawRings,
    drawPolygonTile,
    doubleRings,
    singleSquare,
    doubleSquare,
  ];

  let underlays = [
    doubleRings,
    drawCircleTile,
    drawSquareTile,
    drawRotatedCrossTile,
    drawCircleOfCirclesTile,
    drawRadialLinesTile,
    drawRings,
    drawPolygonTile,
  ];

  let underlayIndex = 0;

  p.setup = () => {
    p.createCanvas(800, 800);
    p.noLoop();
    p.noStroke();
    p.rectMode(p.CENTER);
  };

  p.draw = () => {
    drawGrid(p);
  };

  p.keyPressed = () => {
    if (p.key === ' ') drawGrid(p);
    if (p.key === 'b') {
      isBlackBackground = !isBlackBackground;
      drawGrid(p);
    }
    if (p.key === 'i') {
      aboutDialog.toggle();
    }
  };

  p.mouseClicked = () => {
    drawGrid(p);
  };

  const tileSequencer = () => {
    const nextUnderlay = underlays[underlayIndex];
    underlayIndex = (underlayIndex + 1) % underlays.length;
    if (underlayIndex === 0) underlays = p.shuffle(underlays);
    return nextUnderlay;
  };

  function drawGrid() {
    p.blendMode(p.BLEND); // Reset blend mode to default
    p.background(isBlackBackground ? 0 : 255);
    const cols = 8;
    const rows = 8;
    const tileSize = (p.width / cols) * 0.8; // Reduce tile size to create gaps
    const padding = (p.width / cols) * 0.2; // Padding to create gaps
    let colors = getColorsFromUrl(p, p.random(palettes));

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        colors = p.shuffle(colors, true); // Shuffle the colors array for each tile
        const x = i * (tileSize + padding) + padding / 2;
        const y = j * (tileSize + padding) + padding / 2;
        tileSequencer()(p, x, y, tileSize, colors, p.random([true, false]));
        if (p.random([true, false]))
          p.random(overlays)(
            p,
            x,
            y,
            tileSize,
            colors,
            p.random([true, false]),
          );
      }
    }
  }

  function drawTileBase(
    p,
    x,
    y,
    tileSize,
    colors,
    drawShape,
    numShapes = null,
  ) {
    const shapesCount = numShapes !== null && numShapes !== undefined ? numShapes : p.int(p.random(2, 5));
    for (let i = shapesCount; i > 0; i--) {
      p.fill(colors[(shapesCount - i) % colors.length]);
      drawShape(p, x, y, tileSize, i, shapesCount);
    }
  }

  function singleSquare(p, x, y, tileSize, colors) {
    p.blendMode(p.MULTIPLY);
    p.noFill();
    p.strokeWeight(p.random([1, 2, 3]));
    p.stroke(colors[0]);
    p.rect(x + tileSize / 2, y + tileSize / 2, tileSize - 10, tileSize - 10);
    p.noStroke();
    p.blendMode(p.BLEND);
  }

  function doubleSquare(p, x, y, tileSize, colors) {
    const inset = p.random([1, 2, 3]) * 10;
    p.blendMode(p.MULTIPLY);
    p.noFill();
    p.strokeWeight(p.random([1, 2, 3]));
    p.stroke(colors[0]);
    p.rect(
      x + tileSize / 2,
      y + tileSize / 2,
      tileSize - inset,
      tileSize - inset,
    );
    p.rect(
      x + tileSize / 2,
      y + tileSize / 2,
      tileSize - inset - 10,
      tileSize - inset - 10,
    );

    p.noStroke();
    p.blendMode(p.BLEND);
  }

  function drawCircleTile(p, x, y, tileSize, colors) {
    drawTileBase(
      p,
      x,
      y,
      tileSize,
      colors,
      (p, x, y, tileSize, i, numShapes) => {
        p.ellipse(
          x + tileSize / 2,
          y + tileSize / 2,
          (tileSize * i) / numShapes,
        );
      },
    );
  }

  function drawSquareTile(p, x, y, tileSize, colors) {
    drawTileBase(
      p,
      x,
      y,
      tileSize,
      colors,
      (p, x, y, tileSize, i, numShapes) => {
        p.rect(
          x + tileSize / 2,
          y + tileSize / 2,
          (tileSize * i) / numShapes,
          (tileSize * i) / numShapes,
        );
      },
    );
  }

  function drawRotatedCrossTile(p, x, y, tileSize, colors, rotated = false) {
    const barWidth = tileSize / 4;
    p.blendMode(p.MULTIPLY);
    p.push();
    p.translate(x + tileSize / 2, y + tileSize / 2);
    if (rotated) p.rotate(p.PI / 4);
    p.fill(p.random(colors));
    p.rect(0, 0, tileSize, barWidth, barWidth / 2); // Horizontal bar
    p.fill(p.random(colors));
    p.rect(0, 0, barWidth, tileSize, barWidth / 2); // Vertical bar
    p.pop();
    p.blendMode(p.BLEND); // Reset blend mode to default
  }

  function drawCircleOfCirclesTile(p, x, y, tileSize, colors, rotated = false) {
    const numSmallCircles = p.int(p.random(4, 12));
    const radius = (tileSize / 2.9) * p.map(numSmallCircles, 4, 12, 1, 0.9);
    const angleStep = p.TWO_PI / numSmallCircles;
    const smallCircleRadius = tileSize / (numSmallCircles / 2); // Size of small circles based on their quantity
    p.blendMode(p.MULTIPLY);
    p.fill(colors[0]);
    p.ellipse(x + tileSize / 2, y + tileSize / 2, tileSize / 1.2); // Central circle
    p.fill(colors[1]);
    if (rotated) {
      p.push();
      p.translate(x + tileSize / 2, y + tileSize / 2);
      p.rotate(p.PI / 4);
      p.translate(-x - tileSize / 2, -y - tileSize / 2);
    }
    for (let i = 0; i < numSmallCircles; i++) {
      const angle = i * angleStep;
      const cx = x + tileSize / 2 + p.cos(angle) * radius;
      const cy = y + tileSize / 2 + p.sin(angle) * radius;
      p.ellipse(cx, cy, smallCircleRadius);
    }
    if (rotated) {
      p.pop();
    }
    p.blendMode(p.BLEND); // Reset blend mode to default
  }

  // dashp where 'p' is for predicate
  function drawSoloRing(p, x, y, tileSize, color, dashp, size, weight = null) {
    weight ??= p.random([2, 5, 10, 20]);
    p.blendMode(p.MULTIPLY);
    p.noFill();
    p.stroke(color);
    p.strokeWeight(weight);
    if (dashp) setLineDash(p);
    p.ellipse(x + tileSize / 2, y + tileSize / 2, size - weight / 2);
    p.noStroke();
    resetLineDash(p);
  }

  function doubleRings(p, x, y, tileSize, colors) {
    const weight = p.random([1, 2, 3]);
    drawSoloRing(p, x, y, tileSize, colors[0], false, tileSize - 10, weight);
    drawSoloRing(p, x, y, tileSize, colors[0], false, tileSize - 20, weight);
  }

  function drawRings(p, x, y, tileSize, colors) {
    const numShapes = p.int(p.random(2, 5));
    for (let i = numShapes; i > 0; i--) {
      const color = colors[(numShapes - i) % colors.length];
      const dashp = p.random([true, false]);
      drawSoloRing(p, x, y, tileSize, color, dashp, (tileSize * i) / numShapes);
    }
    p.blendMode(p.BLEND); // Reset blend mode to default
  }

  function drawPolygonTile(p, x, y, tileSize, colors, rotated = true) {
    const weight = p.random([2, 5, 10, 15]);
    const numShapes = p.int(p.random(2, 5));
    p.push();
    p.noFill();
    for (let i = numShapes; i > 0; i--) {
      p.stroke(p.random(colors));
      p.strokeWeight(weight);
      const npoints = p.random([3, 5, 7, 8]);
      p.blendMode(p.MULTIPLY);
      if (rotated) {
        p.translate(x + tileSize / 2, y + tileSize / 2);
        p.rotate(p.PI / p.random([2, 4, 6]));
        p.translate(-x - tileSize / 2, -y - tileSize / 2);
      }
      polygon(
        p,
        x + tileSize / 2,
        y + tileSize / 2,
        (tileSize * i) / 2 / numShapes,
        npoints,
      );
    }
    p.pop();
    p.blendMode(p.BLEND); // Reset blend mode to default
    p.noStroke();
  }

  // tileSize is TILE size (not to go over)
  function drawRadialLinesTile(p, x, y, tileSize, colors) {
    const numLines = p.int(p.random(5, 36));
    const lineLength = (p.PI * tileSize) / p.int(p.random(5, 16));
    const angleStep = p.TWO_PI / numLines;
    const radius = tileSize / 2.5 - lineLength;
    const lineWidth = tileSize / 20;

    drawSoloRing(
      p,
      x,
      y,
      tileSize,
      colors[0],
      p.random([true, true, false]),
      tileSize,
    );
    drawSoloRing(
      p,
      x,
      y,
      tileSize,
      colors[1],
      p.random([true, true, false]),
      tileSize * 0.7,
    );

    p.fill(colors[2]);
    for (let i = 0; i < numLines; i++) {
      const angle = i * angleStep;
      const cx = x + tileSize / 2 + p.cos(angle) * radius;
      const cy = y + tileSize / 2 + p.sin(angle) * radius;
      p.push();
      p.translate(cx, cy);
      p.rotate(angle);
      p.rect(0, 0, lineLength / 2, lineWidth);
      p.pop();
    }
    p.blendMode(p.BLEND); // Reset blend mode to default
  }

  function getColorsFromUrl(p, url) {
    const colorStrings = url.split('/').pop().split('-');
    return colorStrings.map((c) => p.color(`#${c}`));
  }

  function setLineDash(p, pattern = null) {
    pattern ??= p.random(dashes);
    p.drawingContext.lineCap = 'butt';
    p.drawingContext.setLineDash(pattern);
  }

  function resetLineDash(p) {
    p.drawingContext.setLineDash([]);
  }

  function polygon(p, x, y, radius, npoints) {
    const angle = p.TWO_PI / npoints;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += angle) {
      const sx = x + p.cos(a) * radius;
      const sy = y + p.sin(a) * radius;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
});