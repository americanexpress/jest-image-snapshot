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

describe('integration tests', () => {
  const imagePath = path.resolve(__dirname, '../stubs', 'TestImage.png');
  const imageData = fs.readFileSync(imagePath);
  const snapDir = './__tests__/src/__image_snapshots__/';

  const setupInterception = () => {
    // When running the tests with -u we don't actually want to update the
    // our integration snaps or everything goes weird. The integration tests
    // stop failing because all out snapshots update mid-test
    // To prevent this I'm intercepting toMatchImageSnapshot and forcing _updateSnapshot
    // to always be false in the integration tests. This is intentional!
    const intercept = require.requireActual('../../src');
    const originalToMatchImageSnapshot = intercept.toMatchImageSnapshot;

    intercept.toMatchImageSnapshot = function toMatchImageSnapshot(...args) {
      const ctx = this;
      let originalUpdateSnapshot = null;

      // First check if _updateSnapshot is set just in case
      if (ctx && ctx.snapshotState && ctx.snapshotState._updateSnapshot) { // eslint-disable-line no-underscore-dangle,max-len
        originalUpdateSnapshot = ctx.snapshotState._updateSnapshot; // eslint-disable-line no-underscore-dangle,max-len
        // Disable it
        ctx.snapshotState._updateSnapshot = 'none'; // eslint-disable-line no-underscore-dangle
      }

      // Run the comparison
      const result = originalToMatchImageSnapshot.apply(ctx, args);

      // Enable again so that the rest of Jest performs normally
      if (originalUpdateSnapshot) {
        ctx.snapshotState._updateSnapshot = originalUpdateSnapshot; // eslint-disable-line no-underscore-dangle,max-len
      }

      return result;
    };

    return intercept;
  };

  const getSnapshotBasename = identifier => `${identifier}-snap.png`;

  const cleanSnapshot = (customSnapshotIdentifier, snapshotsDir = snapDir) => {
    const snapPath = path.join(snapshotsDir, getSnapshotBasename(customSnapshotIdentifier));

    if (fs.exists(snapPath)) {
      fs.unlink(snapPath);
    }
  };

  beforeAll(() => {
    const toMatchImageSnapshot = setupInterception().toMatchImageSnapshot;
    expect.extend({ toMatchImageSnapshot });
  });

  it('writes a snapshot with no error.', () => {
    const customSnapshotIdentifier = 'integration-1';
    cleanSnapshot(customSnapshotIdentifier);

    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len
  });

  it('matches an identical snapshot.', () => {
    const customSnapshotIdentifier = 'integration-2';
    cleanSnapshot(customSnapshotIdentifier);

    // Write a new snapshot image
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len

    // Then we test and expect it to pass
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len
  });

  it('fails with a different snapshot.', () => {
    const customSnapshotIdentifier = 'integration-3';
    cleanSnapshot(customSnapshotIdentifier);

    // Write a new snapshot image
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len

    const failImagePath = path.resolve(__dirname, '../stubs', 'TestImageFailure.png');
    const failImageData = fs.readFileSync(failImagePath);

    // Test against a different image
    expect(() => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier })).toThrowError(); // eslint-disable-line max-len
  });

  it('fails gracefully with a differently sized image.', () => {
    const customSnapshotIdentifier = 'integration-4';
    cleanSnapshot(customSnapshotIdentifier);

    // First we need to write a new snapshot image
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len

    const failImagePath = path.resolve(__dirname, '../stubs', 'TestImageFailureOversize.png');
    const failImageData = fs.readFileSync(failImagePath);

    // Test against an image much larger than the snapshot.
    expect(() => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier })).toThrowError(); // eslint-disable-line max-len
  });

  it('creates snapshot in custom directory if such is specified.', () => {
    const customSnapshotsDir = path.resolve(__dirname, '__custom_snapshots_dir__');
    const customSnapshotIdentifier = 'integration-5';

    cleanSnapshot(customSnapshotIdentifier, customSnapshotsDir);

    // First we need to write a new snapshot image
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotsDir, customSnapshotIdentifier })).not.toThrowError(); // eslint-disable-line max-len

    // Then we check if the file was created in custom directory
    expect(() => fs.readFileSync(path.resolve(customSnapshotsDir, getSnapshotBasename(customSnapshotIdentifier)))).not.toThrowError(); // eslint-disable-line max-len
  });
});
