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
const Chalk = require('chalk').constructor;
const { runDiffImageToSnapshot } = require('./diff-snapshot');
const fs = require('fs');

const timesCalled = new Map();

const SNAPSHOTS_DIR = '__image_snapshots__';

function updateSnapshotState(originalSnapshotState, partialSnapshotState) {
  if (global.UNSTABLE_SKIP_REPORTING) {
    return originalSnapshotState;
  }
  return merge(originalSnapshotState, partialSnapshotState);
}

function checkResult({
  result,
  snapshotState,
  retryTimes,
  snapshotIdentifier,
  chalk,
}) {
  let pass = true;
  /*
    istanbul ignore next
    `message` is implementation detail. Actual behavior is tested in integration.spec.js
  */
  let message = () => '';

  if (result.updated) {
    // once transition away from jasmine is done this will be a lot more elegant and pure
    // https://github.com/facebook/jest/pull/3668
    updateSnapshotState(snapshotState, { updated: snapshotState.updated + 1 });
  } else if (result.added) {
    updateSnapshotState(snapshotState, { added: snapshotState.added + 1 });
  } else {
    ({ pass } = result);

    updateSnapshotState(snapshotState, { matched: snapshotState.matched + 1 });

    if (!pass) {
      const currentRun = timesCalled.get(snapshotIdentifier);
      if (!retryTimes || (currentRun > retryTimes)) {
        updateSnapshotState(snapshotState, { unmatched: snapshotState.unmatched + 1 });
      }

      const differencePercentage = result.diffRatio * 100;
      message = () => {
        let failure;
        if (result.diffSize) {
          failure = `Expected image to be the same size as the snapshot (${result.imageDimensions.baselineWidth}x${result.imageDimensions.baselineHeight}), but was different (${result.imageDimensions.receivedWidth}x${result.imageDimensions.receivedHeight}).\n`
          + `${chalk.bold.red('See diff for details:')} ${chalk.red(result.diffOutputPath)}`;
        } else {
          failure = `Expected image to match or be a close match to snapshot but was ${differencePercentage}% different from snapshot (${result.diffPixelCount} differing pixels).\n`
          + `${chalk.bold.red('See diff for details:')} ${chalk.red(result.diffOutputPath)}`;
        }

        return failure;
      };
    }
  }

  return {
    message,
    pass,
  };
}

function createSnapshotIdentifier({
  retryTimes,
  testPath,
  currentTestName,
  customSnapshotIdentifier,
  snapshotState,
}) {
  const snapshotIdentifier = customSnapshotIdentifier || kebabCase(`${path.basename(testPath)}-${currentTestName}-${snapshotState._counters.get(currentTestName)}`);
  if (retryTimes) {
    if (!customSnapshotIdentifier) throw new Error('A unique customSnapshotIdentifier must be set when jest.retryTimes() is used');

    timesCalled.set(snapshotIdentifier, (timesCalled.get(snapshotIdentifier) || 0) + 1);
  }
  return snapshotIdentifier;
}

function configureToMatchImageSnapshot({
  customDiffConfig: commonCustomDiffConfig = {},
  customSnapshotsDir: commonCustomSnapshotsDir,
  customDiffDir: commonCustomDiffDir,
  diffDirection: commonDiffDirection = 'horizontal',
  noColors: commonNoColors = false,
  failureThreshold: commonFailureThreshold = 0,
  failureThresholdType: commonFailureThresholdType = 'pixel',
  updatePassedSnapshot: commonUpdatePassedSnapshot = false,
} = {}) {
  return function toMatchImageSnapshot(received, {
    customSnapshotIdentifier = '',
    customSnapshotsDir = commonCustomSnapshotsDir,
    customDiffDir = commonCustomDiffDir,
    diffDirection = commonDiffDirection,
    customDiffConfig = {},
    noColors = commonNoColors,
    failureThreshold = commonFailureThreshold,
    failureThresholdType = commonFailureThresholdType,
    updatePassedSnapshot = commonUpdatePassedSnapshot,
  } = {}) {
    const {
      testPath, currentTestName, isNot, snapshotState,
    } = this;
    const chalk = new Chalk({ enabled: !noColors });

    const retryTimes = parseInt(global[Symbol.for('RETRY_TIMES')], 10) || 0;

    if (isNot) { throw new Error('Jest: `.not` cannot be used with `.toMatchImageSnapshot()`.'); }

    updateSnapshotState(snapshotState, { _counters: snapshotState._counters.set(currentTestName, (snapshotState._counters.get(currentTestName) || 0) + 1) }); // eslint-disable-line max-len

    const snapshotIdentifier = createSnapshotIdentifier({
      retryTimes,
      testPath,
      currentTestName,
      customSnapshotIdentifier,
      snapshotState,
    });

    const snapshotsDir = customSnapshotsDir || path.join(path.dirname(testPath), SNAPSHOTS_DIR);
    const diffDir = customDiffDir || path.join(snapshotsDir, '__diff_output__');
    const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);

    if (snapshotState._updateSnapshot === 'none' && !fs.existsSync(baselineSnapshotPath)) {
      return {
        pass: false,
        message: () => `New snapshot was ${chalk.bold.red('not written')}. The update flag must be explicitly ` +
        'passed to write a new snapshot.\n\n + This is likely because this test is run in a continuous ' +
        'integration (CI) environment in which snapshots are not written by default.\n\n',
      };
    }

    const result =
      runDiffImageToSnapshot({
        receivedImageBuffer: received,
        snapshotsDir,
        diffDir,
        diffDirection,
        snapshotIdentifier,
        updateSnapshot: snapshotState._updateSnapshot === 'all',
        customDiffConfig: Object.assign({}, commonCustomDiffConfig, customDiffConfig),
        failureThreshold,
        failureThresholdType,
        updatePassedSnapshot,
      });

    return checkResult({
      result,
      snapshotState,
      retryTimes,
      snapshotIdentifier,
      chalk,
    });
  };
}

module.exports = {
  toMatchImageSnapshot: configureToMatchImageSnapshot(),
  configureToMatchImageSnapshot,
  updateSnapshotState,
};
