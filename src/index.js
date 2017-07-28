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
/* eslint-disable no-underscore-dangle */
const kebabCase = require('lodash/kebabCase');
const merge = require('lodash/merge');
const path = require('path');
const chalk = require('chalk');
const { diffImageToSnapshot } = require('./diff-snapshot');

// see https://github.com/yahoo/blink-diff/blob/master/index.js#L251-L285 for result codes
const BLINK_RESULTCODE_IDENTICAL = 5;
const BLINK_RESULTCODE_SIMILAR = 7;
const BLINK_RESULTCODE_UNKNOWN = 0;
const BLINK_RESULTCODE_DIFFERENT = 1;

function updateSnapshotState(oldSnapshotState, newSnapshotState) {
  return merge({}, oldSnapshotState, newSnapshotState);
}

function toMatchImageSnapshot(received, { customSnapshotIdentifier = '', customDiffConfig = {} } = {}) {
  const { testPath, currentTestName, isNot } = this;
  // SnapshotState structure can be found here: https://github.com/facebook/jest/blob/master/packages/jest-snapshot/src/State.js
  let { snapshotState } = this;
  if (isNot) { throw new Error('Jest: `.not` cannot be used with `.toMatchImageSnapshot()`.'); }

  updateSnapshotState(snapshotState, { _counters: snapshotState._counters.set(currentTestName, (snapshotState._counters.get(currentTestName) || 0) + 1) }); // eslint-disable-line max-len
  const snapshotIdentifier = customSnapshotIdentifier || kebabCase(`${path.basename(testPath)}-${currentTestName}-${snapshotState._counters.get(currentTestName)}`);

  const result = diffImageToSnapshot({
    imageData: received,
    snapshotIdentifier,
    snapshotsDir: path.join(path.dirname(testPath), '__image_snapshots__'),
    updateSnapshot: snapshotState.update,
    customDiffConfig,
  });
  let pass = true;
  if (result.updated) {
    // once transition away from jasmine is done this will be a lot more elegant and pure
    // https://github.com/facebook/jest/pull/3668
    snapshotState = updateSnapshotState(snapshotState, { updated: snapshotState.updated += 1 });
  } else if (result.added) {
    snapshotState = updateSnapshotState(snapshotState, { added: snapshotState.added += 1 });
  } else if (
    result.code === BLINK_RESULTCODE_IDENTICAL || result.code === BLINK_RESULTCODE_SIMILAR
  ) {
    snapshotState = updateSnapshotState(snapshotState, { matched: snapshotState.matched += 1 });
  } else if (
    result.code === BLINK_RESULTCODE_UNKNOWN || result.code === BLINK_RESULTCODE_DIFFERENT
  ) {
    snapshotState = updateSnapshotState(snapshotState, { unmatched: snapshotState.unmatched += 1 });
    pass = false;
  }

  const message = 'Expected image to match or be a close match to snapshot.\n'
                  + `${chalk.bold.red('See diff for details:')} ${chalk.red(result.diffOutputPath)}`;

  return {
    message,
    pass,
  };
}

module.exports = {
  toMatchImageSnapshot,
  updateSnapshotState,
};
