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
const BlinkDiff = require('blink-diff');
const intersection = require('lodash/intersection');
const mkdirp = require('mkdirp');
const path = require('path');

// see https://github.com/yahoo/blink-diff/blob/master/index.js#L251-L285 for result codes
const BLINK_RESULTCODE_UNKNOWN = 0;
const BLINK_RESULTCODE_DIFFERENT = 1;

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
  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot,
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
  if (fs.existsSync(baselineSnapshotPath)) {
    const outputDir = path.join(snapshotsDir, '__diff_output__');
    const diffOutputPath = path.join(outputDir, `${snapshotIdentifier}-diff.png`);
    const defaultBlinkDiffConfig = {
      imageA: imageData,
      imageBPath: baselineSnapshotPath,
      thresholdType: 'percent',
      threshold: 0.01,
      imageOutputPath: diffOutputPath,
    };

    mkdirp.sync(outputDir);
    const diffConfig = Object.assign({}, defaultBlinkDiffConfig, customDiffConfig);
    const diff = new BlinkDiff(diffConfig);
    const unformattedDiffResult = diff.runSync();

    if (
      updateSnapshot
      && (unformattedDiffResult.code === BLINK_RESULTCODE_UNKNOWN
        || unformattedDiffResult.code === BLINK_RESULTCODE_DIFFERENT
      )
    ) {
      mkdirp.sync(snapshotsDir);
      fs.writeFileSync(baselineSnapshotPath, imageData);
      result = { updated: true };
    } else {
      result = Object.assign(
        {},
        unformattedDiffResult,
        { diffOutputPath }
      );
    }
  } else {
    mkdirp.sync(snapshotsDir);
    fs.writeFileSync(baselineSnapshotPath, imageData);

    result = updateSnapshot ? { updated: true } : { added: true };
  }
  return result;
}

module.exports = {
  unsupportedDiffConfigKeys,
  diffImageToSnapshot,
  isDiffConfigValid,
};
