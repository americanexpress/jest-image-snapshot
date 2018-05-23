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
const isRegExp = require('lodash/isRegExp');
const path = require('path');
const Chalk = require('chalk').constructor;
const { diffImageToSnapshot } = require('./diff-snapshot');
const fs = require('fs');

const SNAPSHOTS_DIR = '__image_snapshots__';

function getReadOnlyMessage(chalk) {
  return `New snapshot was ${chalk.bold.red('not written')}. The update flag must be explicitly ` +
  'passed to write a new snapshot.\n\n + This is likely because this test is run in a continuous ' +
  'integration (CI) environment in which snapshots are not written by default.\n\n';
}

function getInconsistentSnapshotsMessage(
  chalk, { differencePercentage, diffOutputPath, diffPixelCount }
) {
  return `Expected image to match or be a close match to snapshot but was ${differencePercentage}% different from snapshot (${diffPixelCount} differing pixels).\n`
  + `${chalk.bold.red('See diff for details:')} ${chalk.red(diffOutputPath)}`;
}

const matchesException = (expected, received) => {
  if (isRegExp(expected)) {
    return expected.test(received);
  }

  // eslint-disable-next-line eqeqeq
  return expected == received;
};

function updateSnapshotState(originalSnapshotState, partialSnapshotState) {
  return merge(originalSnapshotState, partialSnapshotState);
}

function configureToMatchImageSnapshot({
  customDiffConfig: commonCustomDiffConfig = {},
  noColors: commonNoColors = false,
  failureThreshold: commonFailureThreshold = 0,
  failureThresholdType: commonFailureThresholdType = 'pixel',
} = {}) {
  return function toMatchImageSnapshot(received, {
    customSnapshotIdentifier = '',
    customSnapshotsDir,
    customDiffConfig = {},
    noColors = commonNoColors,
    failureThreshold = commonFailureThreshold,
    failureThresholdType = commonFailureThresholdType,
  } = {}) {
    const { testPath, currentTestName, isNot } = this;
    const chalk = new Chalk({ enabled: !noColors });

    const { snapshotState } = this;
    if (isNot) {
      throw new Error('Jest: `.not` cannot be used with `.toMatchImageSnapshot()`.');
    }

    updateSnapshotState(snapshotState, { _counters: snapshotState._counters.set(currentTestName, (snapshotState._counters.get(currentTestName) || 0) + 1) }); // eslint-disable-line max-len
    const snapshotIdentifier = customSnapshotIdentifier || kebabCase(`${path.basename(testPath)}-${currentTestName}-${snapshotState._counters.get(currentTestName)}`);

    const snapshotsDir = customSnapshotsDir || path.join(path.dirname(testPath), SNAPSHOTS_DIR);
    const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);

    if (snapshotState._updateSnapshot === 'none' && !fs.existsSync(baselineSnapshotPath)) {
      return {
        pass: false,
        message: () => getReadOnlyMessage(chalk),
      };
    }

    const result =
        diffImageToSnapshot({
          receivedImageBuffer: received,
          snapshotsDir,
          snapshotIdentifier,
          updateSnapshot: snapshotState._updateSnapshot === 'all',
          customDiffConfig: Object.assign({}, commonCustomDiffConfig, customDiffConfig),
          failureThreshold,
          failureThresholdType,
        });

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

      if (!pass) {
        updateSnapshotState(snapshotState, { unmatched: snapshotState.unmatched + 1 });
        const differencePercentage = result.diffRatio * 100;
        message = () => getInconsistentSnapshotsMessage(chalk, {
          diffOutputPath: result.diffOutputPath,
          differencePercentage,
          diffPixelCount: result.diffPixelCount,
        });
      }
    }

    return {
      message,
      pass,
    };
  };
}


function configureToThrowErrorMatchingImageSnapshot({
  customDiffConfig: commonCustomDiffConfig = {},
  noColors: commonNoColors = false,
  failureThreshold: commonFailureThreshold = 0,
  failureThresholdType: commonFailureThresholdType = 'pixel',
} = {}) {
  return function toThrowErrorMatchingImageSnapshot(received, {
    customSnapshotIdentifier = '',
    customSnapshotsDir,
    customDiffConfig = {},
    noColors = commonNoColors,
    failureThreshold = commonFailureThreshold,
    failureThresholdType = commonFailureThresholdType,
    expectedException,
  } = {}) {
    const { testPath, currentTestName, isNot } = this;
    const chalk = new Chalk({ enabled: !noColors });

    const { snapshotState } = this;
    if (isNot) {
      throw new Error('Jest: `.not` cannot be used with `.toThrowErrorMatchingImageSnapshot()`.');
    }

    updateSnapshotState(snapshotState, { _counters: snapshotState._counters.set(currentTestName, (snapshotState._counters.get(currentTestName) || 0) + 1) }); // eslint-disable-line max-len
    const snapshotIdentifier = customSnapshotIdentifier || kebabCase(`${path.basename(testPath)}-${currentTestName}-${snapshotState._counters.get(currentTestName)}`);

    const snapshotsDir = customSnapshotsDir || path.join(path.dirname(testPath), SNAPSHOTS_DIR);
    const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}-snap.png`);

    if (snapshotState._updateSnapshot === 'none' && !fs.existsSync(baselineSnapshotPath)) {
      const readOnlyMessage = getReadOnlyMessage(chalk);
      return {
        pass: expectedException ? matchesException(expectedException, readOnlyMessage) : true,
        message: () => readOnlyMessage,
      };
    }

    const result =
        diffImageToSnapshot({
          receivedImageBuffer: received,
          snapshotsDir,
          snapshotIdentifier,
          updateSnapshot: snapshotState._updateSnapshot === 'all',
          customDiffConfig: Object.assign({}, commonCustomDiffConfig, customDiffConfig),
          failureThreshold,
          failureThresholdType,
        });

    if (!result.updated && !result.added && !result.pass) {
      const differencePercentage = result.diffRatio * 100;
      const message = getInconsistentSnapshotsMessage(chalk, {
        diffOutputPath: result.diffOutputPath,
        differencePercentage,
        diffPixelCount: result.diffPixelCount,
      });

      const shouldPass = expectedException ? matchesException(expectedException, message) : true;
      const errorMessage = shouldPass ?
        '' :
        `Expected exception is not matching received exception. Expected: "${message}" but received: "${expectedException}"`;

      return {
        message: () => errorMessage,
        pass: shouldPass,
      };
    }

    return {
      message: () => 'Expected image comparison to throw but snapshots were the same.\n',
      pass: false,
    };
  };
}

const toMatchImageSnapshot = configureToMatchImageSnapshot();
const toThrowErrorMatchingImageSnapshot = configureToThrowErrorMatchingImageSnapshot();

module.exports = {
  toMatchImageSnapshot,
  toThrowErrorMatchingImageSnapshot,
  configureToMatchImageSnapshot,
};
