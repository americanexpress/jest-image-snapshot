const fs = require('fs');
const BlinkDiff = require('blink-diff');
const intersection = require('lodash/intersection');

const unsupportedDiffConfigKeys = [
  'imageAPath',
  'imageA',
  'imageBPath',
  'imageB',
  'imageOutputPath',
];

function isDiffConfigValid(customDiffConfig) {
  let isValid = true;
  if (intersection(unsupportedDiffConfigKeys, Object.keys(customDiffConfig)).length !== 0) {
    isValid = false;
  }
  return isValid;
}

function diffImageToSnapshot(options) {
  const {
    imageData,
    snapshotIdentifier,
    snapshotsDir,
    updateSnapshot = false,
    customDiffConfig = {},
   } = options;

  if (!isDiffConfigValid(customDiffConfig)) {
    throw new Error(
      `Passing in options: ${unsupportedDiffConfigKeys} via Blink-Diff configuration `
      + 'is not supported as those option are internally used. '
      + 'Instead pass your image data as first argument to this function!'
    );
  }

  let result = {};
  const baselineSnapshotPath = `${snapshotsDir}/${snapshotIdentifier}-snap.png`;
  if (fs.existsSync(baselineSnapshotPath) && !updateSnapshot) {
    const outputDir = `${snapshotsDir}/__diff_output__`;
    const diffOutputPath = `${outputDir}/${snapshotIdentifier}-diff.png`;
    const defaultBlinkDiffConfig = {
      imageA: imageData,
      imageBPath: baselineSnapshotPath,
      thresholdType: 'percent',
      threshold: 0.01,
      imageOutputPath: diffOutputPath,
    };

    if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }
    const diffConfig = Object.assign({}, defaultBlinkDiffConfig, customDiffConfig);
    const diff = new BlinkDiff(diffConfig);
    const unformattedDiffResult = diff.runSync();

    result = Object.assign(
      {},
      unformattedDiffResult,
      { diffOutputPath }
    );
  } else {
    if (!fs.existsSync(snapshotsDir)) { fs.mkdirSync(snapshotsDir); }
    fs.writeFileSync(`${snapshotsDir}/${snapshotIdentifier}-snap.png`, imageData);

    // eslint-disable-next-line no-unused-expressions
    updateSnapshot ? result = { updated: true } : result = { added: true };
  }
  return result;
}

module.exports = {
  unsupportedDiffConfigKeys,
  diffImageToSnapshot,
  isDiffConfigValid,
};
