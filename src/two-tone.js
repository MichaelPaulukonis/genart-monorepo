import { p5 } from 'p5js-wrapper'
import { RISOCOLORS } from './risocolors';
import { imgs } from './imagelist';
import '../css/style.css'

// inspired by https://bsky.app/profile/leedoughty.bsky.social/post/3ldh2esstd22h
// https://leedoughty.com/

/** TODO:
  size an element down from max size by maybe 20% at random
  play with larger, too?
  square image plus square image are max v max and a kinda boring
**/

function getRandomUniqueItem(arr, excludeItems) {
  let filteredArr = arr.filter((item) => !excludeItems.includes(item));
  if (filteredArr.length === 0) {
    throw new RangeError("getRandomUniqueItem: no available items to select");
  }
  let randomIndex = Math.floor(Math.random() * filteredArr.length);
  return filteredArr[randomIndex];
}

let currentBlendModeIndex = 0; // Start with the first blend mode

const backgroundModes = [
  {
    color: [0, 0, 0],
    blendModes: ["ADD", "EXCLUSION", "SCREEN", "DIFFERENCE", "LIGHTEST"],
  },
  {
    color: [255, 255, 255],
    blendModes: [
      "MULTIPLY",
      "EXCLUSION",
      "DIFFERENCE",
      "DARKEST",
      "HARD_LIGHT",
    ],
  },
];
let currentBackgroundModeIndex = 0; // Start with the first background mode

let sketch = function (p) {
  let threshold = 128; // Adjust this value for different threshold levels
  let backgroundColor;
  let currentPair = 0; // Track which image-color pair to update next
  let pause = false;
  let autoSave = false;

  let imageColorPairs = [
    { img: null, color: null, buffer: null },
    { img: null, color: null, buffer: null },
  ];

  p.setup = function () {
    p.pixelDensity(2)
    const c = p.createCanvas(p.windowWidth, p.windowHeight);
    c.elt.focus();
    p.imageMode(p.CENTER);
    setBlendModeAndBackground();
    initializeImageColorPairs(); // Initialize both pairs initially
    updateImageColorPair(0);
    updateImageColorPair(1);
  };

  p.mousePressed = function () {
    loadNewImagesAndColors(); // Update one pair at a time
  };

  p.keyPressed = function () {
    if ((p.keyIsDown(p.CONTROL) || p.keyIsDown(91)) && p.key === "s") {
      p.saveCanvas(generateFilename());
      return false; // Prevent default browser behavior
    } else if (p.key === "b") {
      toggleBackgroundColor();
      regenerateBuffers();
    } else if (p.key === "m") {
      cycleBlendMode();
    } else if (p.key === "p") {
      pause = !pause;
    } else if (p.key === "S") {
      autoSave = !autoSave;
      console.log(`autoSave: ${autoSave}`)
    }
  };

  p.draw = () => {
    if (!pause && p.frameCount % 30 === 0) {
      loadNewImagesAndColors();
      if (autoSave) {
         p.saveCanvas(generateFilename());
      }
    }
  };

  function setBlendModeAndBackground() {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex];
    backgroundColor = p.color(...currentBackgroundMode.color);
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]]);
    p.background(p.color(...currentBackgroundMode.color));
  }

  function toggleBackgroundColor() {
    currentBackgroundModeIndex =
      (currentBackgroundModeIndex + 1) % backgroundModes.length;
    currentBlendModeIndex = 0; // Reset to the first blend mode for the new background
    setBlendModeAndBackground();
    updateScreen();
  }

  function regenerateBuffers() {
    imageColorPairs.forEach((pair, index) => {
      if (pair.img && pair.color) {
        p.loadImage("./images/" + pair.img, function (img) {
          if (imageColorPairs[index].buffer && imageColorPairs[index].buffer.remove) {
            imageColorPairs[index].buffer.remove();
          }
          imageColorPairs[index].buffer = p.createMonochromeImage(
            img,
            p.color(pair.color.color)
          );
          updateScreen();
        });
      }
    });
  }

  function cycleBlendMode() {
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex];
    currentBlendModeIndex =
      (currentBlendModeIndex + 1) % currentBackgroundMode.blendModes.length;
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]]);
    updateScreen();
  }

  function generateFilename() {
    let d = new Date();
    return (
      "two_tone_image." +
      d.getFullYear() +
      "." +
      (d.getMonth() + 1) +
      "." +
      d.getDate() +
      "." +
      d.getHours() +
      d.getMinutes() +
      d.getSeconds() +
      ".png"
    );
  }

  function initializeImageColorPairs() {
    imageColorPairs[0].img = getRandomUniqueItem(imgs, []);
    imageColorPairs[0].color = getRandomUniqueItem(RISOCOLORS, []);
    imageColorPairs[1].img = getRandomUniqueItem(imgs, [
      imageColorPairs[0].img,
    ]);
    imageColorPairs[1].color = getRandomUniqueItem(RISOCOLORS, [
      imageColorPairs[0].color,
    ]);
  }

  function loadNewImagesAndColors() {
    updateImageColorPair(currentPair);
    currentPair = (currentPair + 1) % 2; // Toggle between 0 and 1
  }

  function updateImageColorPair(pairIndex) {
    const selectedImage = getRandomUniqueItem(
      imgs,
      imageColorPairs.map((pair) => pair.img)
    );
    const selectedColor = getRandomUniqueItem(
      RISOCOLORS,
      imageColorPairs.map((pair) => pair.color)
    );

    imageColorPairs[pairIndex].img = selectedImage;
    imageColorPairs[pairIndex].color = selectedColor;

    p.loadImage("./images/" + selectedImage, function (img) {
      if (imageColorPairs[pairIndex].buffer && imageColorPairs[pairIndex].buffer.remove) {
        imageColorPairs[pairIndex].buffer.remove();
      }
      imageColorPairs[pairIndex].buffer = p.createMonochromeImage(
        img,
        p.color(selectedColor.color)
      );
      updateScreen();
    });
  }

  function updateScreen() {
    p.clear();
    const currentBackgroundMode = backgroundModes[currentBackgroundModeIndex];
    p.background(currentBackgroundMode.color);
    p.blendMode(p[currentBackgroundMode.blendModes[currentBlendModeIndex]]);
    imageColorPairs.forEach((pair) => {
      if (pair.buffer) p.image(pair.buffer, p.width / 2, p.height / 2);
    });
  }

  p.createMonochromeImage = function (img, monoColor) {
    const scaleRatio = p.calculateScaleRatio(img);
    const scaledWidth = Math.round(img.width * scaleRatio);
    const scaledHeight = Math.round(img.height * scaleRatio);

    const buffer = p.createGraphics(scaledWidth, scaledHeight);
    buffer.image(img, 0, 0, scaledWidth, scaledHeight);
    buffer.loadPixels();

    for (let y = 0; y < scaledHeight * p.pixelDensity(); y++) {
      for (let x = 0; x < scaledWidth * p.pixelDensity(); x++) {
        let index = (x + y * scaledWidth * p.pixelDensity()) * 4;
        let r = buffer.pixels[index];
        let g = buffer.pixels[index + 1];
        let b = buffer.pixels[index + 2];
        let a = buffer.pixels[index + 3];
        let avg = (r + g + b) / 3;
        let bw = avg > threshold ? 255 : 0;

        if (a === 0 || bw === 255) {
          // Transparent pixel or white, set to background color
          buffer.pixels[index] = p.red(backgroundColor);
          buffer.pixels[index + 1] = p.green(backgroundColor);
          buffer.pixels[index + 2] = p.blue(backgroundColor);
        } else {
          buffer.pixels[index] = p.red(monoColor);
          buffer.pixels[index + 1] = p.green(monoColor);
          buffer.pixels[index + 2] = p.blue(monoColor);
        }
        buffer.pixels[index + 3] = 255; // Set alpha to fully opaque
      }
    }
    buffer.updatePixels();
    return buffer;
  };

  p.calculateScaleRatio = function (img) {
    const maxCanvasSize = Math.min(p.width, p.height) * 0.8;
    const maxImgSize = Math.max(img.width, img.height);
    return maxCanvasSize / maxImgSize;
  };
};

new p5(sketch);
