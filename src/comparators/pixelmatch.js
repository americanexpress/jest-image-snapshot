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

const optional = require("optional");
const pixelmatch = optional('pixelmatch');
const fs = require('fs');
const intersection = require('lodash/intersection');
const mkdirp = require('mkdirp');
const path = require('path');
const PNG = require('pngjs').PNG;

function diffImageToSnapshot(options) {
  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    customDiffConfig = {},
   } = options;

  let result = {};
  const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);
  if (fs.existsSync(baselineSnapshotPath) && !updateSnapshot) {
    const outputDir = path.join(snapshotsDir, '__diff_output__');
    const diffOutputPath = path.join(outputDir, `${snapshotIdentifier}-diff.png`);

    const defaultDiffConfig = {
      threshold: 0.01,
    };

    var img1 = PNG.sync.read(imageData);
    var img2 = PNG.sync.read(fs.readFileSync('img2.png'));

    mkdirp.sync(outputDir);
    const diffConfig = Object.assign({}, defaultDiffConfig, customDiffConfig);

    var diffImg = new PNG({width: img1.width, height: img1.height});    
    pixelmatch(img1.data, img2.data, diffImg.data, img1.width, img1.height, diffConfig);

    const unformattedDiffResult = diff.runSync();

    diffImg.pack().pipe(fs.createWriteStream(diffOutputPath));
    

    result = Object.assign(
      {},
      unformattedDiffResult,
      { diffOutputPath }
    );
  } else {
    mkdirp.sync(snapshotsDir);
    fs.writeFileSync(baselineSnapshotPath, imageData);

    result = updateSnapshot ? { updated: true } : { added: true };
  }
  return result;
}

module.exports = {
  diffImageToSnapshot
};
