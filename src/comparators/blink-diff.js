/*
 * Copyright (c) 2017 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const intersection = require('lodash/intersection');
const { ResultTypes, ComparatorResult } = require('../comparator-result');
const BlinkDiff = require('blink-diff');

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
    diffOutputPath,
    baselineSnapshotPath,
    customDiffConfig = {},
   } = options;

  if (!isDiffConfigValid(customDiffConfig)) {
    throw new Error(
      `Passing in options: ${unsupportedDiffConfigKeys} via Blink-Diff configuration `
      + 'is not supported as those option are internally used. '
      + 'Instead pass your image data as first argument to this function!'
    );
  }

  const defaultBlinkDiffConfig = {
    imageA: imageData,
    imageBPath: baselineSnapshotPath,
    thresholdType: 'percent',
    threshold: 0.01,
    imageOutputPath: diffOutputPath,
  };

  const diffConfig = Object.assign({}, defaultBlinkDiffConfig, customDiffConfig);
  const diff = new BlinkDiff(diffConfig);
  const unformattedDiffResult = diff.runSync();
  const resultCode = unformattedDiffResult.code;
  const diffPercentage = unformattedDiffResult.differences / unformattedDiffResult.dimension;

  // see https://github.com/yahoo/blink-diff/blob/master/index.js#L251-L285 for result codes
  return new ComparatorResult(
    resultCode === 0 || resultCode === 1 ? ResultTypes.FAIL : ResultTypes.PASS,
    diffPercentage,
    unformattedDiffResult.differences,
    diffOutputPath);
}

module.exports = {
  unsupportedDiffConfigKeys,
  diffImageToSnapshot,
  isDiffConfigValid,
};
