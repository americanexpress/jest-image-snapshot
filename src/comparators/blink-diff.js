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
const intersection = require('lodash/intersection');
const mkdirp = require('mkdirp');
const path = require('path');
const { ResultTypes, ComparatorResult } = require('../comparator-result');

const unsupportedDiffConfigKeys = [
  'imageAPath',
  'imageA',
  'imageBPath',
  'imageB',
  'imageOutputPath',
];

function isDiffConfigValid(customDiffConfig) {
  return intersection(unsupportedDiffConfigKeys, Object.keys(customDiffConfig)).length === 0;
}

function diffImageToSnapshot(options) {
  const BlinkDiff = require('blink-diff');

  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    customDiffConfig = {},
   } = options;

  if (!isDiffConfigValid(customDiffConfig)) {
    throw new Error(
      `Passing in options: ${unsupportedDiffConfigKeys} via Blink-Diff configuration `
      + 'is not supported as those option are internally used. '
      + 'Instead pass your image data as first argument to this function!'
    );
  }

  let result = {};
  const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);
  if (fs.existsSync(baselineSnapshotPath) && !updateSnapshot) {
    const outputDir = path.join(snapshotsDir, '__diff_output__');
    const diffOutputPath = path.join(outputDir, `${snapshotIdentifier}-diff.png`);
    const defaultBlinkDiffConfig = {
      imageA: imageData,
      imageB: baselineSnapshotPath,
      thresholdType: 'percent',
      threshold: 0.01,
      imageOutputPath: diffOutputPath,
    };

    mkdirp.sync(outputDir);
    const diffConfig = Object.assign({}, defaultBlinkDiffConfig, customDiffConfig);
    const diff = new BlinkDiff(diffConfig);
    const unformattedDiffResult = diff.runSync();

    
    result = new ComparatorResult(
      diffPixels > 0 ? ResultTypes.FAIL : ResultTypes.PASS,
      img1,
      img2,
      diffImg);


    result = Object.assign(
      {},
      unformattedDiffResult,
      { diffOutputPath }
    );

    result = new ComparatorResult(
      unformattedDiffResult.code === 0 || unformattedDiffResult.code === 1 ? ResultTypes.FAIL : ResultTypes.PASS,
      imageData,
      null,
      diff._imageOutput);

  } else {
    result = new ComparatorResult(
      updateSnapshot ? ResultTypes.UPDATE : ResultTypes.ADD,
      imageData,
      null,
      imageData);
  }

  return result;
}

module.exports = {
  unsupportedDiffConfigKeys,
  diffImageToSnapshot,
  isDiffConfigValid,
};