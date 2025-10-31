const fs = require('fs');
const { PNG } = require('pngjs');

const width = 1;
const height = 1;

const png = new PNG({ width, height });

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;
    png.data[idx] = 255; // red
    png.data[idx + 1] = 0; // green
    png.data[idx + 2] = 0; // blue
    png.data[idx + 3] = 255; // alpha
  }
}

png.pack().pipe(fs.createWriteStream('apps/computational-collage/tests/dummy-image.png'));
