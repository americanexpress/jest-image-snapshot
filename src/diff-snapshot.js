/*
 * Copyright (c) 2017 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const ssim = require('ssim.js');
const { PNG } = require('pngjs');
const rimraf = require('rimraf');
const glur = require('glur');
const ImageComposer = require('./image-composer');

/**
 * Helper function to create reusable image resizer
 */
const createImageResizer = (width, height) => (source) => {
  const resized = new PNG({ width, height, fill: true });
  PNG.bitblt(source, resized, 0, 0, source.width, source.height, 0, 0);
  return resized;
};

/**
 * Fills diff area with black transparent color for meaningful diff
 */
/* eslint-disable no-plusplus, no-param-reassign, no-bitwise */
const fillSizeDifference = (width, height) => (image) => {
  const inArea = (x, y) => y > height || x > width;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (inArea(x, y)) {
        const idx = ((image.width * y) + x) << 2;
        image.data[idx] = 0;
        image.data[idx + 1] = 0;
        image.data[idx + 2] = 0;
        image.data[idx + 3] = 64;
      }
    }
  }
  return image;
};
/* eslint-enabled */
/**
 * This was originally embedded in diffImageToSnapshot
 * when it only worked with pixelmatch.  It has a default
 * threshold of 0.01 defined in terms of what it means to pixelmatch.
 * It has been moved here as part of the SSIM implementation to make it
 * a little easier to read and find.
 * More information about this can be found under the options section listed
 * in https://github.com/mapbox/pixelmatch/README.md and in the original pixelmatch
 * code.  There is also some documentation on this in our README.md under the
 * customDiffConfig option.
 * @type {{threshold: number}}
 */
const defaultPixelmatchDiffConfig = {
  threshold: 0.01,
};
/**
 * This is the default SSIM diff configuration
 * for the jest-image-snapshot's use of the ssim.js
 * library.  Bezkrovny is a specific SSIM algorithm optimized
 * for speed by downsampling the origin image into a smaller image.
 * For the small loss in precision, it is roughly 9x faster than the
 * SSIM preset 'fast' -- which is modeled after the original SSIM whitepaper.
 * Wang, et al. 2004 on "Image Quality Assessment: From Error Visibility to Structural Similarity"
 * (https://github.com/obartra/ssim/blob/master/assets/ssim.pdf)
 * Most users will never need or want to change this -- unless --
 * they want to get a better quality generated diff.
 * @type {{ssim: string}}
 */
const defaultSSIMDiffConfig = { ssim: 'bezkrovny' };

/**
 * Helper function for SSIM comparison that allows us to use the existing diff
 * config that works with jest-image-snapshot to pass parameters
 * that will work with SSIM.  It also transforms the parameters to match the spec
 * required by the SSIM library.
 */
const ssimMatch = (
  newImageData,
  baselineImageData,
  diffImageData,
  imageWidth,
  imageHeight,
  diffConfig
) => {
  const newImage = { data: newImageData, width: imageWidth, height: imageHeight };
  const baselineImage = { data: baselineImageData, width: imageWidth, height: imageHeight };
  // eslint-disable-next-line camelcase
  const { ssim_map, mssim } = ssim.ssim(newImage, baselineImage, diffConfig);
  // Converts the SSIM value to different pixels based on image width and height
  // conforms to how pixelmatch works.
  const diffPixels = (1 - mssim) * imageWidth * imageHeight;
  const diffRgbaPixels = new DataView(diffImageData.buffer, diffImageData.byteOffset);
  for (let ln = 0; ln !== imageHeight; ++ln) {
    for (let pos = 0; pos !== imageWidth; ++pos) {
      const rpos = (ln * imageWidth) + pos;
      // initial value is transparent.  We'll add in the SSIM offset.
      // red (ff) green (00) blue (00) alpha (00)
      const diffValue = 0xff000000 + Math.floor(0xff *
        (1 - ssim_map.data[
          // eslint-disable-next-line no-mixed-operators
          (ssim_map.width * Math.round(ssim_map.height * ln / imageHeight)) +
          // eslint-disable-next-line no-mixed-operators
          Math.round(ssim_map.width * pos / imageWidth)]));
      diffRgbaPixels.setUint32(rpos * 4, diffValue);
    }
  }
  return diffPixels;
};

/**
 * Aligns images sizes to biggest common value
 * and fills new pixels with transparent pixels
 */
const alignImagesToSameSize = (firstImage, secondImage) => {
  // Keep original sizes to fill extended area later
  const firstImageWidth = firstImage.width;
  const firstImageHeight = firstImage.height;
  const secondImageWidth = secondImage.width;
  const secondImageHeight = secondImage.height;
  // Calculate biggest common values
  const resizeToSameSize = createImageResizer(
    Math.max(firstImageWidth, secondImageWidth),
    Math.max(firstImageHeight, secondImageHeight)
  );
  // Resize both images
  const resizedFirst = resizeToSameSize(firstImage);
  const resizedSecond = resizeToSameSize(secondImage);
  // Fill resized area with black transparent pixels
  return [
    fillSizeDifference(firstImageWidth, firstImageHeight)(resizedFirst),
    fillSizeDifference(secondImageWidth, secondImageHeight)(resizedSecond),
  ];
};

const isFailure = ({ pass, updateSnapshot }) => !pass && !updateSnapshot;

const shouldUpdate = ({ pass, updateSnapshot, updatePassedSnapshot }) =>
  updateSnapshot && (!pass || (pass && updatePassedSnapshot));

const shouldFail = ({
  totalPixels,
  diffPixelCount,
  hasSizeMismatch,
  allowSizeMismatch,
  failureThresholdType,
  failureThreshold,
}) => {
  let pass = false;
  let diffSize = false;
  const diffRatio = diffPixelCount / totalPixels;
  if (hasSizeMismatch) {
    // do not fail if allowSizeMismatch is set
    pass = allowSizeMismatch;
    diffSize = true;
  }
  if (!diffSize || pass === true) {
    if (failureThresholdType === 'pixel') {
      pass = diffPixelCount <= failureThreshold;
    } else if (failureThresholdType === 'percent') {
      pass = diffRatio <= failureThreshold;
    } else {
      throw new Error(`Unknown failureThresholdType: ${failureThresholdType}. Valid options are "pixel" or "percent".`);
    }
  }
  return {
    pass,
    diffSize,
    diffRatio,
  };
};

function composeDiff(options) {
  const {
    diffDirection, baselineImage, diffImage, receivedImage, imageWidth, imageHeight, onlyDiff,
  } = options;
  const composer = new ImageComposer({
    direction: diffDirection,
  });

  if (onlyDiff) {
    composer.addImage(diffImage, imageWidth, imageHeight);
  } else {
    composer.addImage(baselineImage, imageWidth, imageHeight);
    composer.addImage(diffImage, imageWidth, imageHeight);
    composer.addImage(receivedImage, imageWidth, imageHeight);
  }
  return composer;
}

function writeFileWithHooks({
  pathToFile,
  content,
  runtimeHooksPath,
  testPath,
  currentTestName,
}) {
  let finalContent = content;
  if (runtimeHooksPath) {
    let runtimeHooks;
    try {
      // As `diffImageToSnapshot` can be called in a worker, and as we cannot pass a function
      // to a worker, we need to use an external file path that can be imported
      // eslint-disable-next-line import/no-dynamic-require, global-require
      runtimeHooks = require(runtimeHooksPath);
    } catch (e) {
      throw new Error(`Couldn't import ${runtimeHooksPath}: ${e.message}`);
    }
    try {
      finalContent = runtimeHooks.onBeforeWriteToDisc({
        buffer: content,
        destination: pathToFile,
        testPath,
        currentTestName,
      });
    } catch (e) {
      throw new Error(`Couldn't execute onBeforeWriteToDisc: ${e.message}`);
    }
  }
  fs.writeFileSync(pathToFile, finalContent);
}

function diffImageToSnapshot(options) {
  const {
    receivedImageBuffer,
    snapshotIdentifier,
    snapshotsDir,
    storeReceivedOnFailure,
    receivedPostfix = '-received',
    receivedDir = path.join(options.snapshotsDir, '__received_output__'),
    diffDir = path.join(options.snapshotsDir, '__diff_output__'),
    diffDirection,
    onlyDiff = false,
    updateSnapshot = false,
    updatePassedSnapshot = false,
    customDiffConfig = {},
    failureThreshold,
    failureThresholdType,
    blur,
    allowSizeMismatch = false,
    comparisonMethod = 'pixelmatch',
    testPath,
    currentTestName,
    runtimeHooksPath,
  } = options;

  const comparisonFn = comparisonMethod === 'ssim' ? ssimMatch : pixelmatch;
  let result = {};
  const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}.png`);
  if (!fs.existsSync(baselineSnapshotPath)) {
    fs.mkdirSync(path.dirname(baselineSnapshotPath), { recursive: true });
    writeFileWithHooks({
      pathToFile: baselineSnapshotPath,
      content: receivedImageBuffer,
      runtimeHooksPath,
      testPath,
      currentTestName,
    });
    result = { added: true };
  } else {
    const receivedSnapshotPath = path.join(receivedDir, `${snapshotIdentifier}${receivedPostfix}.png`);
    rimraf.sync(receivedSnapshotPath);

    const diffOutputPath = path.join(diffDir, `${snapshotIdentifier}-diff.png`);
    rimraf.sync(diffOutputPath);

    const defaultDiffConfig = comparisonMethod !== 'ssim' ? defaultPixelmatchDiffConfig : defaultSSIMDiffConfig;

    const diffConfig = Object.assign({}, defaultDiffConfig, customDiffConfig);

    const rawReceivedImage = PNG.sync.read(receivedImageBuffer);
    const rawBaselineImage = PNG.sync.read(fs.readFileSync(baselineSnapshotPath));
    const hasSizeMismatch = (
      rawReceivedImage.height !== rawBaselineImage.height ||
      rawReceivedImage.width !== rawBaselineImage.width
    );
    const imageDimensions = {
      receivedHeight: rawReceivedImage.height,
      receivedWidth: rawReceivedImage.width,
      baselineHeight: rawBaselineImage.height,
      baselineWidth: rawBaselineImage.width,
    };
    // Align images in size if different
    const [receivedImage, baselineImage] = hasSizeMismatch
      ? alignImagesToSameSize(rawReceivedImage, rawBaselineImage)
      : [rawReceivedImage, rawBaselineImage];
    const imageWidth = receivedImage.width;
    const imageHeight = receivedImage.height;

    if (typeof blur === 'number' && blur > 0) {
      glur(receivedImage.data, imageWidth, imageHeight, blur);
      glur(baselineImage.data, imageWidth, imageHeight, blur);
    }

    const diffImage = new PNG({ width: imageWidth, height: imageHeight });

    let diffPixelCount = 0;

    diffPixelCount = comparisonFn(
      receivedImage.data,
      baselineImage.data,
      diffImage.data,
      imageWidth,
      imageHeight,
      diffConfig
    );

    const totalPixels = imageWidth * imageHeight;

    const {
      pass,
      diffSize,
      diffRatio,
    } = shouldFail({
      totalPixels,
      diffPixelCount,
      hasSizeMismatch,
      allowSizeMismatch,
      failureThresholdType,
      failureThreshold,
    });

    if (isFailure({ pass, updateSnapshot })) {
      if (storeReceivedOnFailure) {
        fs.mkdirSync(path.dirname(receivedSnapshotPath), { recursive: true });
        writeFileWithHooks({
          pathToFile: receivedSnapshotPath,
          content: receivedImageBuffer,
          runtimeHooksPath,
          testPath,
          currentTestName,
        });
        result = { receivedSnapshotPath };
      }

      fs.mkdirSync(path.dirname(diffOutputPath), { recursive: true });
      const composer = composeDiff({
        diffDirection, baselineImage, diffImage, receivedImage, imageWidth, imageHeight, onlyDiff,
      });

      const composerParams = composer.getParams();

      const compositeResultImage = new PNG({
        width: composerParams.compositeWidth,
        height: composerParams.compositeHeight,
      });

      // copy baseline, diff, and received images into composite result image
      composerParams.images.forEach((image, index) => {
        PNG.bitblt(
          image.imageData, compositeResultImage, 0, 0, image.imageWidth, image.imageHeight,
          composerParams.offsetX * index, composerParams.offsetY * index
        );
      });
      // Set filter type to Paeth to avoid expensive auto scanline filter detection
      // For more information see https://www.w3.org/TR/PNG-Filters.html
      const pngBuffer = PNG.sync.write(compositeResultImage, { filterType: 4 });
      writeFileWithHooks({
        pathToFile: diffOutputPath,
        content: pngBuffer,
        runtimeHooksPath,
        testPath,
        currentTestName,
      });

      result = {
        ...result,
        pass: false,
        diffSize,
        imageDimensions,
        diffOutputPath,
        diffRatio,
        diffPixelCount,
        imgSrcString: `data:image/png;base64,${pngBuffer.toString('base64')}`,
      };
    } else if (shouldUpdate({ pass, updateSnapshot, updatePassedSnapshot })) {
      fs.mkdirSync(path.dirname(baselineSnapshotPath), { recursive: true });
      writeFileWithHooks({
        pathToFile: baselineSnapshotPath,
        content: receivedImageBuffer,
        runtimeHooksPath,
        testPath,
        currentTestName,
      });
      result = { updated: true };
    } else {
      result = {
        pass,
        diffSize,
        diffRatio,
        diffPixelCount,
        diffOutputPath,
      };
    }
  }
  return result;
}


function runDiffImageToSnapshot(options) {
  options.receivedImageBuffer = options.receivedImageBuffer.toString('base64');

  const serializedInput = JSON.stringify(options);

  let result = {};

  const writeDiffProcess = childProcess.spawnSync(
    process.execPath, [`${__dirname}/diff-process.js`],
    {
      input: Buffer.from(serializedInput),
      stdio: ['pipe', 'inherit', 'inherit', 'pipe'],
      maxBuffer: options.maxChildProcessBufferSizeInBytes,
    }
  );

  if (writeDiffProcess.status === 0) {
    const output = writeDiffProcess.output[3].toString();
    result = JSON.parse(output);
  } else {
    throw new Error(`Error running image diff: ${(writeDiffProcess.error && writeDiffProcess.error.message) || 'Unknown Error'}`);
  }

  return result;
}

module.exports = {
  diffImageToSnapshot,
  runDiffImageToSnapshot,
};
