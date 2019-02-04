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

/* eslint-disable global-require */
const fs = require('fs');
const path = require('path');

describe('diff-snapshot', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('runDiffImageToSnapshot', () => {
    const mockSpawnSync = jest.fn();
    const fakeRequest = {
      receivedImageBuffer: Buffer.from('abcdefg'),
      snapshotIdentifier: 'foo',
      snapshotsDir: 'bar',
      updateSnapshot: false,
      failureThreshold: 0,
      failureThresholdType: 'pixel',
    };

    function setupTest(spawnReturn) {
      mockSpawnSync.mockReturnValue(spawnReturn);
      jest.mock('child_process', () => ({ spawnSync: mockSpawnSync }));
      const { runDiffImageToSnapshot } = require('../src/diff-snapshot');
      return runDiffImageToSnapshot;
    }

    it('runs external process and returns result', () => {
      const runDiffImageToSnapshot = setupTest({
        status: 0, output: [null, null, null, JSON.stringify({ add: true, updated: false })],
      });

      expect(runDiffImageToSnapshot(fakeRequest)).toEqual({ add: true, updated: false });

      expect(mockSpawnSync).toBeCalled();
    });

    it('throws when process returns a non-zero status', () => {
      const runDiffImageToSnapshot = setupTest({ status: 1 });
      expect(() => runDiffImageToSnapshot(fakeRequest)).toThrow();
    });
  });

  describe('diffImageToSnapshot', () => {
    const mockSnapshotsDir = path.normalize('/path/to/snapshots');
    const mockDiffDir = path.normalize('/path/to/snapshots/__diff_output__');
    const mockSnapshotIdentifier = 'id1';
    const mockImagePath = './__tests__/stubs/TestImage.png';
    const mockImageBuffer = fs.readFileSync(mockImagePath);
    const mockBigImagePath = './__tests__/stubs/TestImage150x150.png';
    const mockBigImageBuffer = fs.readFileSync(mockBigImagePath);
    const mockFailImagePath = './__tests__/stubs/TestImageFailure.png';
    const mockFailImageBuffer = fs.readFileSync(mockFailImagePath);
    const mockMkdirSync = jest.fn();
    const mockMkdirpSync = jest.fn();
    const mockWriteFileSync = jest.fn();
    const mockPixelMatch = jest.fn();

    function setupTest({
      snapshotDirExists,
      snapshotExists,
      outputDirExists,
      defaultExists = true,
      pixelmatchResult = 0,
    }) {
      const mockFs = Object.assign({}, fs, {
        existsSync: jest.fn(),
        mkdirSync: mockMkdirSync,
        writeFileSync: mockWriteFileSync,
        readFileSync: jest.fn(),
      });

      jest.mock('fs', () => mockFs);
      jest.mock('mkdirp', () => ({ sync: mockMkdirpSync }));
      const { diffImageToSnapshot } = require('../src/diff-snapshot');

      mockFs.existsSync.mockImplementation((p) => {
        switch (p) {
          case path.join(mockSnapshotsDir, `${mockSnapshotIdentifier}-snap.png`):
            return snapshotExists;
          case mockDiffDir:
            return !!outputDirExists;
          case mockSnapshotsDir:
            return !!snapshotDirExists;
          default:
            return !!defaultExists;
        }
      });
      mockFs.readFileSync.mockImplementation((p) => {
        const bn = path.basename(p);

        if (bn === 'id1-snap.png' && snapshotExists) {
          return mockImageBuffer;
        }

        return null;
      });

      jest.mock('pixelmatch', () => mockPixelMatch);
      mockPixelMatch.mockImplementation(() => pixelmatchResult);

      return diffImageToSnapshot;
    }

    it('should run comparison if there is already a snapshot stored and updateSnapshot flag is not set', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(result).toMatchObject({
        diffOutputPath: path.join(mockSnapshotsDir, '__diff_output__', 'id1-diff.png'),
        diffRatio: 0,
        diffPixelCount: 0,
        pass: true,
      });
      // Check that pixelmatch was not called
      expect(mockPixelMatch).not.toHaveBeenCalled();
    });

    it('it should not write a diff if a test passes', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 0 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(result).toMatchObject({
        diffOutputPath: path.join(mockSnapshotsDir, '__diff_output__', 'id1-diff.png'),
        diffRatio: 0,
        diffPixelCount: 0,
        pass: true,
      });
      // Check that pixelmatch was not called
      expect(mockPixelMatch).not.toHaveBeenCalled();

      // Check that that it did not attempt to write a diff
      expect(mockWriteFileSync.mock.calls).toEqual([]);
    });

    it('should write a diff image if the test fails', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 5000 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(result).toMatchObject({
        diffOutputPath: path.join(mockSnapshotsDir, '__diff_output__', 'id1-diff.png'),
        diffRatio: 0.5,
        diffPixelCount: 5000,
        pass: false,
      });
      expect(mockPixelMatch).toHaveBeenCalledTimes(1);
      expect(mockPixelMatch).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(Buffer),
        expect.any(Buffer),
        100,
        100,
        { threshold: 0.01 }
      );

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });

    it('should fail if image passed is a different size', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 5000 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockBigImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(result).toMatchObject({
        diffOutputPath: path.join(mockSnapshotsDir, '__diff_output__', 'id1-diff.png'),
        pass: false,
      });
      expect(mockPixelMatch).toHaveBeenCalledTimes(1);
      expect(mockPixelMatch).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(Buffer),
        expect.any(Buffer),
        150,
        150,
        { threshold: 0.01 }
      );

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    });

    it('should pass <= failureThreshold pixel', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 250 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 250,
        failureThresholdType: 'pixel',
      });

      expect(result.pass).toBe(true);
      expect(result.diffPixelCount).toBe(250);
      expect(result.diffRatio).toBe(0.025);
    });

    it('should pass = image checksums', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 0 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(result.pass).toBe(true);
      expect(result.diffPixelCount).toBe(0);
      expect(result.diffRatio).toBe(0);
    });

    it('should run pixelmatch != image checksums', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 250 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 250,
        failureThresholdType: 'pixel',
      });

      expect(mockPixelMatch).toHaveBeenCalledTimes(1);
      expect(result.pass).toBe(true);
      expect(result.diffPixelCount).toBe(250);
      expect(result.diffRatio).toBe(0.025);
    });

    it('should fail > failureThreshold pixel', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 251 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 250,
        failureThresholdType: 'pixel',
      });

      expect(result.pass).toBe(false);
      expect(result.diffPixelCount).toBe(251);
      expect(result.diffRatio).toBe(0.0251);
    });

    it('should pass <= failureThreshold percent', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 250 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0.025,
        failureThresholdType: 'percent',
      });

      expect(result.pass).toBe(true);
      expect(result.diffPixelCount).toBe(250);
      expect(result.diffRatio).toBe(0.025);
    });

    it('should fail > failureThreshold percent', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 251 });
      const result = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0.025,
        failureThresholdType: 'percent',
      });

      expect(result.pass).toBe(false);
      expect(result.diffPixelCount).toBe(251);
      expect(result.diffRatio).toBe(0.0251);
    });

    it('should take the default diff config', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });

      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      // Check that pixelmatch was not called
      expect(mockPixelMatch).not.toHaveBeenCalled();
    });

    it('should merge custom configuration with default configuration if custom config is passed', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });

      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        customDiffConfig: {
          threshold: 0.1,
          foo: 'bar',
        },
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      // Check that pixelmatch was not called
      expect(mockPixelMatch).not.toHaveBeenCalled();
    });

    it('should create diff output directory if there is not one already and test is failing', () => {
      const diffImageToSnapshot = setupTest({
        snapshotExists: true,
        outputDirExists: false,
        pixelmatchResult: 100,
      });
      diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockMkdirpSync).toHaveBeenCalledWith(path.join(mockSnapshotsDir, '__diff_output__'));
    });

    it('should not create diff output directory if test passed', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: false });
      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });

    it('should not create diff output directory if there is one there already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: true });
      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(path.join(mockSnapshotsDir, '__diff_output__'));
    });

    it('should create snapshots directory if there is not one already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: false });
      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        updatePassedSnapshot: true,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockMkdirpSync).toHaveBeenCalledWith(mockSnapshotsDir);
    });

    it('should not create snapshots directory if there already is one', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: true });
      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(mockSnapshotsDir);
    });

    it('should create snapshot in __image_snapshots__ directory if there is not a snapshot created yet', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false, snapshotDirExists: false });
      diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(mockWriteFileSync).toHaveBeenCalledWith(path.join(mockSnapshotsDir, `${mockSnapshotIdentifier}-snap.png`), mockImageBuffer);
    });

    it('should return updated flag if snapshot was updated', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        updatePassedSnapshot: true,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(diffResult).toHaveProperty('updated', true);
    });

    it('should return added flag if snapshot was added', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false });
      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        diffDirection: 'vertical',
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(diffResult).toHaveProperty('added', true);
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        path.join(mockSnapshotsDir, 'id1-snap.png'),
        expect.any(Buffer)
      );
    });

    it('should return path to comparison output image if a comparison was performed', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(diffResult).toHaveProperty('diffOutputPath', path.join(mockSnapshotsDir, '__diff_output__', `${mockSnapshotIdentifier}-diff.png`));
    });

    it('should throw an error if an unknown threshold type is supplied', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });

      expect(() => {
        diffImageToSnapshot({
          receivedImageBuffer: mockFailImageBuffer,
          snapshotIdentifier: mockSnapshotIdentifier,
          snapshotsDir: mockSnapshotsDir,
          diffDir: mockDiffDir,
          updateSnapshot: false,
          failureThreshold: 0,
          failureThresholdType: 'banana',
        });
      }).toThrowErrorMatchingSnapshot();
    });

    it('should not write a file if updatePassedSnapshot is false', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });

      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        updatePassedSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(diffResult).toHaveProperty('pass', true);
    });

    it('should write a file if updatePassedSnapshot is true on passing test', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });

      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        updatePassedSnapshot: true,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(diffResult).toHaveProperty('updated', true);
    });

    it('should update snapshot on failure if updatePassedSnapshot is false', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, pixelmatchResult: 500 });

      const diffResult = diffImageToSnapshot({
        receivedImageBuffer: mockFailImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        diffDir: mockDiffDir,
        updateSnapshot: true,
        updatePassedSnapshot: false,
        failureThreshold: 0,
        failureThresholdType: 'pixel',
      });

      expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
      expect(diffResult).toHaveProperty('updated', true);
    });
  });
});
