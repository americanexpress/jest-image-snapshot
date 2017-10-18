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

const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const { ResultTypes, ComparatorResult } = require('./comparator-result');

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
    const comparatorOptions = Object.assign({
      baselineSnapshotPath,
      diffOutputPath: path.join(snapshotsDir, '__diff_output__', `${snapshotIdentifier}-diff.png`),
    }, options);

    // Build output paths here in a single place and create necessary directories
    mkdirp.sync(path.dirname(comparatorOptions.diffOutputPath));

    try {
      // Load the comparator dynamically
      const comparatorModule = require(`./comparators/${comparator}`); // eslint-disable-line global-require, import/no-dynamic-require

      // Use it to get a result
      return comparatorModule.diffImageToSnapshot(comparatorOptions);
    } catch (ex) {
      throw Error(`Unknown comparator: ${comparator}. Valid options are blink-diff or pixelmatch.`);
    }
  }

  // If the snapshot doesn't exist or we're supposed to update it just write it straight back
  mkdirp.sync(snapshotsDir);
  fs.writeFileSync(baselineSnapshotPath, imageData);

  if (updateSnapshot) {
    return new ComparatorResult(ResultTypes.UPDATE);
  }

  return new ComparatorResult(ResultTypes.ADD);
}

module.exports = {
  diffImageToSnapshot,
};
