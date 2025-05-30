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

const fs = require('fs');
const path = require('path');
const { rimrafSync } = require('rimraf');
const uniqueId = require('lodash/uniqueId');
const sizeOf = require('image-size');
const { SnapshotState } = require('jest-snapshot');
const { toMatchImageSnapshot } = require('../src');

describe('toMatchImageSnapshot', () => {
  const fromStubs = file => path.resolve(__dirname, './stubs', file);
  const imageData = fs.readFileSync(fromStubs('TestImage.png'));
  const diffOutputDir = (snapshotsDir = '__image_snapshots__') => path.join(snapshotsDir, '/__diff_output__/');
  const customSnapshotsDir = path.resolve(__dirname, '__custom_snapshots_dir__');
  const cleanupRequiredIndicator = 'cleanup-required-';
  const getIdentifierIndicatingCleanupIsRequired = () => uniqueId(cleanupRequiredIndicator);
  const getSnapshotFilename = identifier => `${identifier}.png`;
  const diffExists = identifier => fs.existsSync(path.join(__dirname, diffOutputDir(), `${identifier}-diff.png`));

  beforeAll(() => {
    // In tests, skip reporting (skip snapshotState update to not mess with our test report)
    global.UNSTABLE_SKIP_REPORTING = true;
    expect.extend({ toMatchImageSnapshot });
  });

  beforeEach(() => {
    rimrafSync(`**/${cleanupRequiredIndicator}*`, { glob: true });
  });

  afterAll(() => {
    rimrafSync(`**/${cleanupRequiredIndicator}*`, { glob: true });
  });

  describe('happy path', () => {
    it('writes snapshot with no error if there is not one stored already', () => {
      const snapshotsDir = path.resolve(__dirname, '__image_snapshots__');
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();
      expect(
        fs.existsSync(path.join(snapshotsDir, getSnapshotFilename(customSnapshotIdentifier)))
      ).toBe(true);
    });

    it('matches an identical snapshot', () => {
      expect(() => expect(imageData).toMatchImageSnapshot()).not.toThrowError();
    });

    it('creates a snapshot in a custom directory if such is specified', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier, customSnapshotsDir }) // eslint-disable-line max-len
      ).not.toThrowError();

      expect(
        fs.existsSync(path.join(customSnapshotsDir, getSnapshotFilename(customSnapshotIdentifier)))
      ).toBe(true);
    });

    it('does not write a result image for passing tests', () => {
      const customSnapshotIdentifier = 'integration-6';

      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      expect(diffExists(customSnapshotIdentifier)).toBe(false);
    });

    it('does not write a result image for passing tests (ssim)', () => {
      const customSnapshotIdentifier = 'integration-6';

      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({
          customSnapshotIdentifier,
          comparisonMethod: 'ssim',
        })
      ).not.toThrowError();

      expect(diffExists(customSnapshotIdentifier)).toBe(false);
    });

    it('should work with TypedArray', () => {
      const imageTypedArray = new Uint8Array(imageData.buffer);
      expect(() => expect(imageTypedArray).toMatchImageSnapshot()).not.toThrowError();
    });

    it('should work with base64 encoded strings', () => {
      const imageString = imageData.toString('base64');
      expect(() => expect(imageString).toMatchImageSnapshot()).not.toThrowError();
    });
  });

  describe('updates', () => {
    const customSnapshotIdentifier = 'integration-update';
    const updateImageData = fs.readFileSync(fromStubs('TestImageUpdate1pxOff.png'));
    const updateImageSnapshotPath = path.join(__dirname, '__image_snapshots__', `${customSnapshotIdentifier}.png`);

    beforeEach(() => {
      fs.writeFileSync(updateImageSnapshotPath, imageData);
    });

    afterAll(() => {
      fs.writeFileSync(updateImageSnapshotPath, imageData);
    });

    it('does not write a result image for passing tests in update mode by default', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        failureThreshold: 2,
        failureThresholdType: 'pixel',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).toEqual(imageData);
    });

    it('writes a result image for passing test in update mode with updatePassedSnapshots: true', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        updatePassedSnapshots: true,
        failureThreshold: 2,
        failureThresholdType: 'pixel',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).not.toEqual(updateImageData);
    });

    it('writes a result image for passing test in update mode with updatePassedSnapshots: true (ssim)', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        updatePassedSnapshots: true,
        failureThreshold: 2,
        failureThresholdType: 'pixel',
        comparisonMode: 'ssim',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).not.toEqual(updateImageData);
    });

    it('writes a result image for failing test in update mode by default', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).toEqual(updateImageData);
    });

    it('writes a result image for failing test in update mode with updatePassedSnapshots: false', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        updatePassedSnapshots: true,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).toEqual(updateImageData);
    });

    it('writes a result image for failing test in update mode with updatePassedSnapshots: false (ssim)', () => {
      const updateModeMatcher = toMatchImageSnapshot.bind({
        snapshotState: new SnapshotState(__filename, {
          updateSnapshot: 'all',
        }),
        testPath: __filename,
      });
      updateModeMatcher(updateImageData, {
        customSnapshotIdentifier,
        updatePassedSnapshots: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
        comparisonMode: 'ssim',
      });
      expect(fs.readFileSync(updateImageSnapshotPath)).toEqual(updateImageData);
    });
  });

  describe('failures', () => {
    const failImageData = fs.readFileSync(fromStubs('TestImageFailure.png'));
    const oversizeImageData = fs.readFileSync(fromStubs('TestImageFailureOversize.png'));
    const biggerImageData = fs.readFileSync(fromStubs('TestImage150x150.png'));

    it('fails for a different snapshot', () => {
      const expectedError = /^Expected image to match or be a close match to snapshot but was 86\.45% different from snapshot \(8645 differing pixels\)\./;
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      // Write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // Test against a different image
      expect(
        () => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrowError(expectedError);
    });

    it('fails with differently sized images and outputs diff', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // Test against an image much larger than the snapshot.
      expect(
        () => expect(oversizeImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrowError(/Expected image to be the same size as the snapshot \(100x100\), but was different \(153x145\)/);

      expect(diffExists(customSnapshotIdentifier))
        .toBe(true);
    });

    it('fails with images without diff pixels after being resized', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      expect(
        () => expect(biggerImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrowError(/Expected image to be the same size as the snapshot \(100x100\), but was different \(150x150\)/);

      expect(diffExists(customSnapshotIdentifier)).toBe(true);
    });

    it('writes a result image for failing tests', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData)
          .toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // then test against a different image
      expect(
        () => expect(failImageData)
          .toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrow();

      expect(fs.existsSync(pathToResultImage))
        .toBe(true);

      // just because file was written does not mean it is a png image
      expect(sizeOf(pathToResultImage)).toHaveProperty('type', 'png');
    });

    it('writes a result image for failing tests (ssim)', () => {
      const largeImageData = fs.readFileSync(fromStubs('LargeTestImage.png'));
      const largeFailureImageData = fs.readFileSync(fromStubs('LargeTestImageFailure.png'));
      const largeImageFailureDiffData =
        fs.readFileSync(fromStubs('LargeTestImage-LargeTestImageFailure-ssim-diff.png'));
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(largeImageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier, comparisonMethod: 'ssim',
          })
      )
        .not
        .toThrowError();

      // then test against a different image
      expect(
        () => expect(largeFailureImageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier, comparisonMethod: 'ssim',
          })
      )
        .toThrow();

      expect(fs.existsSync(pathToResultImage))
        .toBe(true);

      expect(fs.readFileSync(pathToResultImage)).toMatchImageSnapshot(largeImageFailureDiffData);
      // just because file was written does not mean it is a png image
      expect(sizeOf(pathToResultImage))
        .toHaveProperty('type', 'png');
    });

    it('writes a result image for failing tests with horizontal layout', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            diffDirection: 'horizontal',
          })
      )
        .not
        .toThrowError();

      // then test against a different image
      expect(
        () => expect(failImageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            diffDirection: 'horizontal',
          })
      )
        .toThrow();

      expect(fs.existsSync(pathToResultImage))
        .toBe(true);

      expect(sizeOf(pathToResultImage))
        .toMatchObject({
          width: 300,
          height: 100,
          type: 'png',
        });
    });

    it('writes a result image for failing tests with vertical layout', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            diffDirection: 'vertical',
          })
      )
        .not
        .toThrowError();

      // then test against a different image
      expect(
        () => expect(failImageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            diffDirection: 'vertical',
          })
      )
        .toThrow();

      expect(fs.existsSync(pathToResultImage))
        .toBe(true);

      expect(sizeOf(pathToResultImage))
        .toMatchObject({
          width: 100,
          height: 300,
          type: 'png',
        });
    });

    it('removes result image from previous test runs for the same snapshot', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData)
          .toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // then test against a different image (to generate a results image)
      expect(
        () => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrow();

      // then test against image that should not generate results image (as it is passing test)
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      expect(diffExists(customSnapshotIdentifier))
        .toBe(false);
    });

    it('only outputs the diff when onlyDiff is enabled', () => {
      const failureImageData = fs.readFileSync(fromStubs('TestImageUpdate1pxOff.png'));
      const imageFailureOnlyDiffData =
        fs.readFileSync(fromStubs('TestImageUpdate1pxOff-onlyDiff-diff.png'));

      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            onlyDiff: true,
          })
      )
        .not
        .toThrowError();

      // then test against a different image
      expect(
        () => expect(failureImageData)
          .toMatchImageSnapshot({
            customSnapshotIdentifier,
            onlyDiff: true,
            // required for coverage
            runInProcess: true,
          })
      )
        .toThrow(/Expected image to match or be a close match/);

      expect(fs.existsSync(pathToResultImage))
        .toBe(true);

      expect(fs.readFileSync(pathToResultImage)).toEqual(imageFailureOnlyDiffData);
      // just because file was written does not mean it is a png image
      expect(sizeOf(pathToResultImage))
        .toHaveProperty('type', 'png');
    });

    it('handles diffs for large images', () => {
      const largeImageData = fs.readFileSync(fromStubs('LargeTestImage.png'));
      const largeFailureImageData = fs.readFileSync(fromStubs('LargeTestImageFailure.png'));
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      // First we need to write a new snapshot image
      expect(
        () => expect(largeImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // then test against a different image
      expect(
        () => expect(largeFailureImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrow(/Expected image to match or be a close match/);
    });

    describe('Desktop Images Test', () => {
      it('not to throw at 6pct with pixelmatch with', () => {
        const largeImageData = fs.readFileSync(fromStubs('Desktop 1_082.png'));
        const largeFailureImageData = fs.readFileSync(fromStubs('Desktop 1_083.png'));
        const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
        // First we need to write a new snapshot image
        expect(
          () => expect(largeImageData)
            .toMatchImageSnapshot({
              failureThreshold: 0.06,
              failureThresholdType: 'percent',
              customSnapshotIdentifier,
            })
        )
          .not
          .toThrowError();

        // then test against a different image
        expect(
          () => expect(largeFailureImageData)
            .toMatchImageSnapshot({
              failureThreshold: 0.06,
              failureThresholdType: 'percent',
              customSnapshotIdentifier,
            })
        )
          .not
          .toThrowError();
      });
      it('to throw at 1pct with SSIM', () => {
        const largeImageData = fs.readFileSync(fromStubs('Desktop 1_082.png'));
        const largeFailureImageData = fs.readFileSync(fromStubs('Desktop 1_083.png'));
        const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
        // First we need to write a new snapshot image
        expect(
          () => expect(largeImageData)
            .toMatchImageSnapshot({
              comparisonMethod: 'ssim',
              failureThreshold: 0.01,
              failureThresholdType: 'percent',
              customSnapshotIdentifier,
            })
        )
          .not
          .toThrowError();

        // then test against a different image
        expect(
          () => expect(largeFailureImageData)
            .toMatchImageSnapshot({
              comparisonMethod: 'ssim',
              failureThreshold: 0.01,
              failureThresholdType: 'percent',
              customSnapshotIdentifier,
              // required for coverage
              runInProcess: true,
            })
        )
          .toThrow(/Expected image to match or be a close match/);
      });
    });
  });
});
