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

const mockRunSync = jest.fn(() => {});

jest.mock('blink-diff', () => jest.fn(() => ({
  runSync: mockRunSync,
})));

describe('blink-diff', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  test('should have a list of unsupported blink diff custom configurations', () => {
    const { unsupportedDiffConfigKeys } = require('../../../src/comparators/blink-diff');

    expect(unsupportedDiffConfigKeys).toMatchSnapshot();
  });

  describe('isDiffConfigValid', () => {
    const { isDiffConfigValid } = require('../../../src/comparators/blink-diff');

    test('returns false if any configuration passed is included in the list of unsupported configurations', () => {
      expect(isDiffConfigValid({ imageOutputPath: 'path/to/output.png' })).toBe(false);
    });

    test('returns true if no configuration passed is included in the list of unsupported configurations', () => {
      expect(isDiffConfigValid({ supportedConfiguration: true })).toBe(true);
    });
  });

  describe('diffImageToSnapshot', () => {
    const mockSnapshotsDir = path.normalize('/path/to/snapshots');
    const mockSnapshotIdentifier = 'id1';
    const mockImageBuffer = 'pretendthisisimagebufferandnotjustastring';
    const mockMkdirSync = jest.fn();
    const mockMkdirpSync = jest.fn();
    const mockWriteFileSync = jest.fn();

    function setupTest({
      snapshotDirExists,
      snapshotExists,
      outputDirExists,
      defaultExists = true,
    }) {
      const mockFs = Object.assign({}, fs, {
        existsSync: jest.fn(),
        mkdirSync: mockMkdirSync,
        writeFileSync: mockWriteFileSync,
      });
      jest.mock('fs', () => mockFs);
      jest.mock('mkdirp', () => ({ sync: mockMkdirpSync }));
      const { diffImageToSnapshot } = require('../../../src/comparators/blink-diff');

      mockFs.existsSync.mockImplementation((p) => {
        switch (p) {
          case path.join(mockSnapshotsDir, `${mockSnapshotIdentifier}-snap.png`):
            return snapshotExists;
          case path.join(mockSnapshotsDir, '__diff_output__'):
            return !!outputDirExists;
          case mockSnapshotsDir:
            return !!snapshotDirExists;
          default:
            return !!defaultExists;
        }
      });

      return diffImageToSnapshot;
    }

    test('should throw if an unsupported configuration is passed', () => {
      const diffImageToSnapshot = setupTest({});
      expect(() =>
        diffImageToSnapshot({
          imageData: mockImageBuffer,
          snapshotIdentifier: mockSnapshotIdentifier,
          snapshotsDir: mockSnapshotsDir,
          customDiffConfig: {
            imageOutputPath: path.normalize('path/to/output/dir')
          },
        })
      ).toThrowErrorMatchingSnapshot();
    });

    test('should run comparison if there is already a snapshot stored and updateSnapshot flag is not set', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockRunSync).toHaveBeenCalled();
    });

    test('should merge custom configuration with default configuration if custom config is passed', () => {
      const mockBlinkDiff = require('blink-diff');
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockBlinkDiff).toHaveBeenCalledWith({
        imageA: mockImageBuffer,
        imageBPath: path.join(mockSnapshotsDir, `${mockSnapshotIdentifier}-snap.png`),
        threshold: 0.01,
        imageOutputPath: path.join(mockSnapshotsDir, '__diff_output__', `${mockSnapshotIdentifier}-diff.png`),
        thresholdType: 'percent',
      });
    });

    test('should create diff output directory if there is not one already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockMkdirpSync).toHaveBeenCalledWith(path.join(mockSnapshotsDir, '__diff_output__'));
    });

    test('should not create diff output directory if there is one there already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(path.join(mockSnapshotsDir, '__diff_output__'));
    });

    test('should create snapshots directory is there is not one already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(mockMkdirpSync).toHaveBeenCalledWith(mockSnapshotsDir);
    });

    test('should not create snapshots directory if there already is one', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(mockSnapshotsDir);
    });

    test('should create snapshot in __image_snapshots__ directory if there is not a snapshot created yet', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false, snapshotDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockWriteFileSync).toHaveBeenCalledWith(path.join(mockSnapshotsDir, `${mockSnapshotIdentifier}-snap.png`), mockImageBuffer);
    });

    test('should return updated flag is snapshot was updated', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(diffResult).toHaveProperty('updated', true);
    });

    test('should return added flag is snapshot was added', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(diffResult).toHaveProperty('added', true);
    });

    test('should return path to comparison output image if a comparison was performed', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(diffResult).toHaveProperty('diffOutputPath', path.join(mockSnapshotsDir, '__diff_output__', `${mockSnapshotIdentifier}-diff.png`));
    });
  });
});
