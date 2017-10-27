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
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const mkdirp = require('mkdirp');
const path = require('path');

function diffImageToSnapshot(options) {
  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    customDiffConfig = {},
    failureThreshold,
    failureThresholdType,
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

    const comparisonImg = PNG.sync.read(imageData);
    const baselineImg = PNG.sync.read(fs.readFileSync(baselineSnapshotPath));

    const diffImg = new PNG({ width: comparisonImg.width, height: comparisonImg.height });
    const pixelCountDiff = pixelmatch(
      comparisonImg.data,
      baselineImg.data,
      diffImg.data,
      comparisonImg.width,
      comparisonImg.height,
      diffConfig
    );

    const totalPixels = comparisonImg.width * comparisonImg.height;
    const diffRatio = pixelCountDiff / totalPixels;

    let pass = false;
    if (failureThresholdType === 'pixel') {
      pass = pixelCountDiff <= failureThreshold;
    } else if (failureThresholdType === 'percent') {
      pass = diffRatio <= failureThreshold;
    } else {
      throw new Error(`Unknown failureThresholdType: ${failureThresholdType}. Valid options are "pixel" or "percent".`);
    }

    if (!pass) {
      mkdirp.sync(outputDir);
      const buffer = PNG.sync.write(diffImg);
      fs.writeFileSync(diffOutputPath, buffer);
    }

    result = {
      pass,
      diffOutputPath,
      diffRatio,
      pixelCountDiff,
    };
  } else {
    mkdirp.sync(snapshotsDir);
    fs.writeFileSync(baselineSnapshotPath, imageData);

    result = updateSnapshot ? { updated: true } : { added: true };
  }
  return result;
}

module.exports = {
  diffImageToSnapshot,
};
