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

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const pixelmatch = require('pixelmatch');
const mkdirp = require('mkdirp');
const { PNG } = require('pngjs');

function renderImages(sourceImages, imageWidth, imageHeight, isVertical) {
  const imagesCount = sourceImages.length;
  const compositeResultImage = new PNG({
    width: imageWidth * (isVertical ? 1 : imagesCount),
    height: imageHeight * (isVertical ? imagesCount : 1),
  });
  for (let i = 0; i < imagesCount; i += 1) {
    PNG.bitblt(
      sourceImages[i], compositeResultImage,
      0, 0, imageWidth, imageHeight,
      isVertical ? 0 : imageWidth * i,
      isVertical ? imageHeight * i : 0
    );
  }
  return compositeResultImage;
}

function diffImageToSnapshot(options) {
  const {
    receivedImageBuffer,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    customDiffConfig = {},
    failureThreshold,
    failureThresholdType,
    verticalDiffArrange,
  } = options;

  let result = {};
  const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);
  if (fs.existsSync(baselineSnapshotPath) && !updateSnapshot) {
    const outputDir = path.join(snapshotsDir, '__diff_output__');
    const diffOutputPath = path.join(outputDir, `${snapshotIdentifier}-diff.png`);
    const defaultDiffConfig = {
      threshold: 0.01,
    };

    const diffConfig = Object.assign({}, defaultDiffConfig, customDiffConfig);

    const receivedImage = PNG.sync.read(receivedImageBuffer);
    const baselineImage = PNG.sync.read(fs.readFileSync(baselineSnapshotPath));

    if (
      receivedImage.height !== baselineImage.height || receivedImage.width !== baselineImage.width
    ) {
      throw new Error('toMatchImageSnapshot(): Received image size must match baseline snapshot size in order to make comparison.');
    }
    const imageWidth = receivedImage.width;
    const imageHeight = receivedImage.height;
    const diffImage = new PNG({ width: imageWidth, height: imageHeight });

    const diffPixelCount = pixelmatch(
      receivedImage.data,
      baselineImage.data,
      diffImage.data,
      imageWidth,
      imageHeight,
      diffConfig
    );

    const totalPixels = imageWidth * imageHeight;
    const diffRatio = diffPixelCount / totalPixels;

    let pass = false;
    if (failureThresholdType === 'pixel') {
      pass = diffPixelCount <= failureThreshold;
    } else if (failureThresholdType === 'percent') {
      pass = diffRatio <= failureThreshold;
    } else {
      throw new Error(`Unknown failureThresholdType: ${failureThresholdType}. Valid options are "pixel" or "percent".`);
    }

    if (!pass) {
      mkdirp.sync(outputDir);
      const compositeResultImage = renderImages(
        verticalDiffArrange == null ?
          [diffImage] :
          [baselineImage, diffImage, receivedImage],
        imageWidth, imageHeight,
        verticalDiffArrange
      );

      const input = { imagePath: diffOutputPath, image: compositeResultImage };

      // writing diff in separate process to avoid perf issues associated with Math in Jest VM (https://github.com/facebook/jest/issues/5163)
      const writeDiffProcess = childProcess.spawnSync('node', [`${__dirname}/write-result-diff-image.js`], { input: Buffer.from(JSON.stringify(input)) });
      // in case of error print to console
      if (writeDiffProcess.stderr.toString()) { console.log(writeDiffProcess.stderr.toString()); } // eslint-disable-line no-console, max-len
    }

    result = {
      pass,
      diffOutputPath,
      diffRatio,
      diffPixelCount,
    };
  } else {
    mkdirp.sync(snapshotsDir);
    fs.writeFileSync(baselineSnapshotPath, receivedImageBuffer);

    result = updateSnapshot ? { updated: true } : { added: true };
  }
  return result;
}

module.exports = {
  diffImageToSnapshot,
};
