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
const rimraf = require('rimraf');
const uniqueId = require('lodash/uniqueId');
const isPng = require('is-png');

describe('toMatchImageSnapshot', () => {
  const imagePath = path.resolve(__dirname, './stubs', 'TestImage.png');
  const imageData = fs.readFileSync(imagePath);
  const diffOutputDir = (snapshotsDir = '__image_snapshots__') => path.join(snapshotsDir, '/__diff_output__/');
  const customSnapshotsDir = path.resolve(__dirname, '__custom_snapshots_dir__');
  const cleanupRequiredIndicator = 'cleanup-required-';

  const getIdentifierIndicatingCleanupIsRequired = () => uniqueId(cleanupRequiredIndicator);
  const getSnapshotFilename = identifier => `${identifier}-snap.png`;

  beforeAll(() => {
    const { toMatchImageSnapshot } = require('../src'); // eslint-disable-line global-require
    expect.extend({ toMatchImageSnapshot });
  });

  beforeEach(() => {
    rimraf.sync(`**/${cleanupRequiredIndicator}*`);
  });

  afterAll(() => {
    rimraf.sync(`**/${cleanupRequiredIndicator}*`);
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

      expect(
        fs.existsSync(path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`))
      ).toBe(false);
    });
  });

  describe('failures', () => {
    const failImagePath = path.resolve(__dirname, './stubs', 'TestImageFailure.png');
    const failImageData = fs.readFileSync(failImagePath);

    const oversizeImagePath = path.resolve(__dirname, './stubs', 'TestImageFailureOversize.png');
    const oversizeImageData = fs.readFileSync(oversizeImagePath);

    it('fails for a different snapshot', () => {
      const expectedError = /^Expected image to match or be a close match to snapshot but was 86\.55000000000001% different from snapshot \(8655 differing pixels\)\./;
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

    it('fails gracefully with a differently sized image', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();

      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // Test against an image much larger than the snapshot.
      expect(
        () => expect(oversizeImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrowErrorMatchingSnapshot();
    });

    it('writes a result image for failing tests', () => {
      const customSnapshotIdentifier = getIdentifierIndicatingCleanupIsRequired();
      const pathToResultImage = path.join(__dirname, diffOutputDir(), `${customSnapshotIdentifier}-diff.png`);
      // First we need to write a new snapshot image
      expect(
        () => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).not.toThrowError();

      // then test against a different image
      expect(
        () => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier })
      ).toThrow();

      expect(fs.existsSync(pathToResultImage)).toBe(true);

      const imageBuffer = fs.readFileSync(pathToResultImage);
      // just because file was written does not mean it is a png image
      expect(isPng(imageBuffer)).toBe(true);
    });
  });
});
