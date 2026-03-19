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
const path = require('path');
const { createColors } = require('picocolors');
const { diffImageToSnapshot, runDiffImageToSnapshot } = require('./diff-snapshot');
const fs = require('fs');
const OutdatedSnapshotReporter = require('./outdated-snapshot-reporter');

/**
 * Converts a string to kebab-case.
 * Handles camelCase, PascalCase, spaces, dots, underscores, and hyphens.
 * Equivalent to lodash/kebabCase for snapshot identifier generation.
 */
function kebabCase(str) {
  return String(str)
    // Insert a hyphen between a lowercase letter and an uppercase letter (camelCase boundary)
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    // Insert a hyphen between consecutive uppercase letters followed by a lowercase (e.g. "XMLParser" -> "XML-Parser")
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    // Insert a hyphen between a letter and a digit (e.g. "test1" -> "test-1")
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    // Insert a hyphen between a digit and a letter (e.g. "1test" -> "1-test")
    .replace(/(\d)([a-zA-Z])/g, '$1-$2')
    .toLowerCase()
    // Replace any non-alphanumeric character (or sequence) with a single hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

const timesCalled = new Map();

const SNAPSHOTS_DIR = '__image_snapshots__';

function toBuffer(data) {
  if (data == null || Buffer.isBuffer(data)) {
    return data;
  }
  if (typeof data === 'string') {
    return Buffer.from(data, 'base64');
  }

  return Buffer.from(data);
}

function updateSnapshotState(originalSnapshotState, partialSnapshotState) {
  if (global.UNSTABLE_SKIP_REPORTING) {
    return originalSnapshotState;
  }
  return Object.assign(originalSnapshotState, partialSnapshotState);
}

function checkResult({
  result,
  snapshotState,
  retryTimes,
  snapshotIdentifier,
  chalk,
  dumpDiffToConsole,
  dumpInlineDiffToConsole,
  allowSizeMismatch,
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

    if (pass) {
      updateSnapshotState(snapshotState, { matched: snapshotState.matched + 1 });
    } else {
      const currentRun = timesCalled.get(snapshotIdentifier);
      if (!retryTimes || (currentRun > retryTimes)) {
        updateSnapshotState(snapshotState, { unmatched: snapshotState.unmatched + 1 });
      }

      const differencePercentage = result.diffRatio * 100;
      message = () => {
        let failure;
        if (result.diffSize && !allowSizeMismatch) {
          failure = `Expected image to be the same size as the snapshot (${result.imageDimensions.baselineWidth}x${result.imageDimensions.baselineHeight}), but was different (${result.imageDimensions.receivedWidth}x${result.imageDimensions.receivedHeight}).\n`;
        } else {
          failure = `Expected image to match or be a close match to snapshot but was ${differencePercentage}% different from snapshot (${result.diffPixelCount} differing pixels).\n`;
        }

        failure += `${chalk.bold(chalk.red('See diff for details:'))} ${chalk.red(result.diffOutputPath)}`;

        const supportedInlineTerms = [
          'iTerm.app',
          'WezTerm',
        ];

        if (dumpInlineDiffToConsole && (supportedInlineTerms.includes(process.env.TERM_PROGRAM) || 'ENABLE_INLINE_DIFF' in process.env)) {
          failure += `\n\n\t\x1b]1337;File=name=${Buffer.from(result.diffOutputPath).toString('base64')};inline=1;width=40:${result.imgSrcString.replace('data:image/png;base64,', '')}\x07\x1b\n\n`;
        } else if (dumpDiffToConsole || dumpInlineDiffToConsole) {
          failure += `\n${chalk.bold(chalk.red('Or paste below image diff string to your browser`s URL bar.'))}\n ${result.imgSrcString}`;
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
  const counter = snapshotState._counters.get(currentTestName);
  const defaultIdentifier = kebabCase(`${path.basename(testPath)}-${currentTestName}-${counter}`);

  let snapshotIdentifier = customSnapshotIdentifier || `${defaultIdentifier}-snap`;

  if (typeof customSnapshotIdentifier === 'function') {
    const customRes = customSnapshotIdentifier({
      testPath, currentTestName, counter, defaultIdentifier,
    });

    if (retryTimes && !customRes) {
      throw new Error('A unique customSnapshotIdentifier must be set when jest.retryTimes() is used');
    }

    snapshotIdentifier = customRes || defaultIdentifier;
  }

  if (retryTimes) {
    if (!customSnapshotIdentifier) throw new Error('A unique customSnapshotIdentifier must be set when jest.retryTimes() is used');

    timesCalled.set(snapshotIdentifier, (timesCalled.get(snapshotIdentifier) || 0) + 1);
  }

  return snapshotIdentifier;
}

function configureToMatchImageSnapshot({
  customDiffConfig: commonCustomDiffConfig = {},
  customSnapshotIdentifier: commonCustomSnapshotIdentifier,
  customSnapshotsDir: commonCustomSnapshotsDir,
  storeReceivedOnFailure: commonStoreReceivedOnFailure = false,
  customReceivedDir: commonCustomReceivedDir,
  customReceivedPostfix: commonCustomReceivedPostfix,
  customDiffDir: commonCustomDiffDir,
  onlyDiff: commonOnlyDiff = false,
  runtimeHooksPath: commonRuntimeHooksPath = undefined,
  diffDirection: commonDiffDirection = 'horizontal',
  noColors: commonNoColors,
  failureThreshold: commonFailureThreshold = 0,
  failureThresholdType: commonFailureThresholdType = 'pixel',
  updatePassedSnapshot: commonUpdatePassedSnapshot = false,
  blur: commonBlur = 0,
  runInProcess: commonRunInProcess = false,
  dumpDiffToConsole: commonDumpDiffToConsole = false,
  dumpInlineDiffToConsole: commonDumpInlineDiffToConsole = false,
  allowSizeMismatch: commonAllowSizeMismatch = false,
  // Default to 10 MB instead of node's default 1 MB
  // See https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options
  maxChildProcessBufferSizeInBytes:
    commonMaxChildProcessBufferSizeInBytes = 10 * 1024 * 1024, // 10 MB
  comparisonMethod: commonComparisonMethod = 'pixelmatch',
} = {}) {
  return function toMatchImageSnapshot(received, {
    customSnapshotIdentifier = commonCustomSnapshotIdentifier,
    customSnapshotsDir = commonCustomSnapshotsDir,
    storeReceivedOnFailure = commonStoreReceivedOnFailure,
    customReceivedDir = commonCustomReceivedDir,
    customReceivedPostfix = commonCustomReceivedPostfix,
    customDiffDir = commonCustomDiffDir,
    onlyDiff = commonOnlyDiff,
    runtimeHooksPath = commonRuntimeHooksPath,
    diffDirection = commonDiffDirection,
    customDiffConfig = {},
    noColors = commonNoColors,
    failureThreshold = commonFailureThreshold,
    failureThresholdType = commonFailureThresholdType,
    updatePassedSnapshot = commonUpdatePassedSnapshot,
    blur = commonBlur,
    runInProcess = commonRunInProcess,
    dumpDiffToConsole = commonDumpDiffToConsole,
    dumpInlineDiffToConsole = commonDumpInlineDiffToConsole,
    allowSizeMismatch = commonAllowSizeMismatch,
    maxChildProcessBufferSizeInBytes = commonMaxChildProcessBufferSizeInBytes,
    comparisonMethod = commonComparisonMethod,
  } = {}) {
    const {
      testPath, currentTestName, isNot, snapshotState,
    } = this;
    const chalk = typeof noColors !== 'undefined'
      ? createColors(!noColors)
      : createColors();

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
    const receivedDir = customReceivedDir;
    const receivedPostfix = customReceivedPostfix;
    const diffDir = customDiffDir;
    const baselineSnapshotPath = path.join(snapshotsDir, `${snapshotIdentifier}.png`);
    OutdatedSnapshotReporter.markTouchedFile(baselineSnapshotPath);

    if (snapshotState._updateSnapshot === 'none' && !fs.existsSync(baselineSnapshotPath)) {
      return {
        pass: false,
        message: () => `New snapshot was ${chalk.bold(chalk.red('not written'))}. The update flag must be explicitly ` +
        'passed to write a new snapshot.\n\n + This is likely because this test is run in a continuous ' +
        'integration (CI) environment in which snapshots are not written by default.\n\n',
      };
    }

    const imageToSnapshot = runInProcess ? diffImageToSnapshot : runDiffImageToSnapshot;

    const result =
      imageToSnapshot({
        receivedImageBuffer: toBuffer(received),
        snapshotsDir,
        storeReceivedOnFailure,
        receivedDir,
        receivedPostfix,
        diffDir,
        diffDirection,
        testPath,
        currentTestName,
        onlyDiff,
        snapshotIdentifier,
        updateSnapshot: snapshotState._updateSnapshot === 'all',
        customDiffConfig: Object.assign({}, commonCustomDiffConfig, customDiffConfig),
        failureThreshold,
        failureThresholdType,
        updatePassedSnapshot,
        blur,
        allowSizeMismatch,
        maxChildProcessBufferSizeInBytes,
        comparisonMethod,
        runtimeHooksPath,
      });

    return checkResult({
      result,
      snapshotState,
      retryTimes,
      snapshotIdentifier,
      chalk,
      dumpDiffToConsole,
      dumpInlineDiffToConsole,
      allowSizeMismatch,
    });
  };
}

module.exports = {
  toMatchImageSnapshot: configureToMatchImageSnapshot(),
  configureToMatchImageSnapshot,
  updateSnapshotState,
};
