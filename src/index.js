const kebabCase = require('lodash/kebabCase');
const merge = require('lodash/merge');
const path = require('path');
const chalk = require('chalk');
const { diffImageToSnapshot } = require('./diff-snapshot');

function updateSnapshotState(oldSnapshotState, newSnapshotState) {
  return merge({}, oldSnapshotState, newSnapshotState);
}

const toMatchImageSnapshot = function toMatchImageSnapshot(received, customDiffConfig = {}) {
  const { testPath, currentTestName, isNot } = this;
  let { snapshotState } = this;
  if (isNot) { throw new Error('Jest: `.not` cannot be used with `.toMatchImageSnapshot()`.'); }

  const snapshotIdentifier = kebabCase(`${path.basename(testPath)}-${currentTestName}`);
  const result = diffImageToSnapshot({
    imageData: received,
    snapshotIdentifier,
    snapshotsDir: `${path.dirname(testPath)}/__image_snapshots__`,
    updateSnapshot: snapshotState._updateSnapshot === 'all', // eslint-disable-line no-underscore-dangle
    customDiffConfig,
  });
  let pass = true;
  if (result.updated) {
    // once transition away from jasmine is done this will be a lot more elegant and pure
    // https://github.com/facebook/jest/pull/3668
    snapshotState = updateSnapshotState(snapshotState, { updated: snapshotState.updated += 1 });
  } else if (result.added) {
    snapshotState = updateSnapshotState(snapshotState, { added: snapshotState.added += 1 });
  } else if (result.code === 0 || result.code === 1) {
    pass = false;
  }

  const message = 'Expected image to match or be a close match to snapshot.\n'
                  + `${chalk.bold.red('See diff for details:')} ${chalk.red(result.diffOutputPath)}`;

  return {
    message,
    pass,
  };
};

module.exports = {
  toMatchImageSnapshot,
  updateSnapshotState,
};
