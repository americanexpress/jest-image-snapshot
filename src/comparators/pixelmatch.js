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

const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const { ResultTypes, ComparatorResult } = require('../comparator-result');

function diffImageToSnapshot(options) {
  const {
    imageData,
    baselineSnapshotPath,
    diffOutputPath,
    customDiffConfig = {},
   } = options;

  const defaultDiffConfig = {
    threshold: 0.01,
  };

  const comparisonImg = PNG.sync.read(imageData);
  const baselineImg = PNG.sync.read(fs.readFileSync(baselineSnapshotPath));

  const diffConfig = Object.assign({}, defaultDiffConfig, customDiffConfig);

  const diffImg = new PNG({ width: comparisonImg.width, height: comparisonImg.height });
  const diffPixels = pixelmatch(
    comparisonImg.data, baselineImg.data,
    diffImg.data,
    comparisonImg.width, comparisonImg.height,
    diffConfig
  );

  const buffer = PNG.sync.write(diffImg);
  fs.writeFileSync(diffOutputPath, buffer);

  const totalPixels = comparisonImg.width * comparisonImg.height;
  const diffPercentage = diffPixels / totalPixels;

  return new ComparatorResult(
    diffPixels > 0 ? ResultTypes.FAIL : ResultTypes.PASS,
    diffPercentage,
    diffPixels,
    diffOutputPath
  );
}

module.exports = {
  diffImageToSnapshot,
};