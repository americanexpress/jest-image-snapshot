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

const blinkDiffComparator = require('./comparators/blink-diff');
const pixelmatchComparator = require('./comparators/pixelmatch');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');

function diffImageToSnapshot(options) {
  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    comparator = 'blink-diff',
  } = options;

  // Build a path to the snapshot then check if it exists and that
  // we're not supposed to be updating it.
  const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);

  if (fs.existsSync(baselineSnapshotPath) && !updateSnapshot) {
    const comparatorOptions = Object.assign({}, options);

    // Build output paths here in a single place and create necessary directories
    comparatorOptions.baselineSnapshotPath = baselineSnapshotPath;
    comparatorOptions.diffOutputPath = path.join(snapshotsDir, '__diff_output__', `${snapshotIdentifier}-diff.png`);
    mkdirp.sync(path.dirname(comparatorOptions.diffOutputPath));

    // Pick a comparator
    let comparatorModule = null;
    switch (comparator) {
      case 'pixelmatch':
        comparatorModule = pixelmatchComparator;
        break;
      case 'blink-diff':
        comparatorModule = blinkDiffComparator;
        break;
      default:
        throw Error(`Unknown comparator: ${comparator}`);
    }

    // Use it to get a result
    return comparatorModule.diffImageToSnapshot(comparatorOptions);
  }

  // If the snapshot doesn't exist or we're supposed to update it just write it straight back
  mkdirp.sync(snapshotsDir);
  fs.writeFileSync(baselineSnapshotPath, imageData);

  return null;
}

module.exports = {
  diffImageToSnapshot,
};
