/*
 * Copyright (c) 2017 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

const fs = require('fs');
const path = require('path');

describe('toMatchImageSnapshot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  jest.mock('../../src/comparators/blink-diff');
  jest.mock('../../src/comparators/pixelmatch');

  const mockSnapshotsDir = path.normalize('./path/to/snapshots');
  const mockMkdirpSync = jest.fn();

  const mockFs = Object.assign({}, fs, {
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  });

  jest.mock('fs', () => mockFs);
  jest.mock('mkdirp', () => ({ sync: mockMkdirpSync }));

  mockFs.existsSync.mockImplementation((p) => {
    const bn = path.basename(p);

    switch (bn) {
      case 'pass-snap.png':
        return true;
      case 'fail-snap.png':
        return true;
      case 'not-exist-snap.png':
        return false;
      default:
        return true;
    }
  });

  const { diffImageToSnapshot } = require('../../src/diff-snapshot'); // eslint-disable-line global-require

  test('It should use blink-diff by default', () => {
    diffImageToSnapshot({
      snapshotsDir: mockSnapshotsDir,
      snapshotIdentifier: 'foo',
    });

    const comparator = require('../../src/comparators/blink-diff'); // eslint-disable-line global-require
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();

    const diffImageToSnapshotConfig = comparator.diffImageToSnapshot.mock.calls[0][0];
    expect(diffImageToSnapshotConfig.snapshotsDir).toEqual(mockSnapshotsDir);
    expect(diffImageToSnapshotConfig.snapshotIdentifier).toEqual('foo');
    expect(diffImageToSnapshotConfig.baselineSnapshotPath).toEqual(path.join(mockSnapshotsDir, 'foo-snap.png'));
    expect(diffImageToSnapshotConfig.diffOutputPath).toEqual(path.join(mockSnapshotsDir, '__diff_output__', 'foo-diff.png'));
  });

  test('It should use blink-diff when set', () => {
    diffImageToSnapshot({
      snapshotsDir: mockSnapshotsDir,
      snapshotIdentifier: 'pass',
      comparator: 'blink-diff',
    });

    const comparator = require('../../src/comparators/blink-diff'); // eslint-disable-line global-require
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();

    const diffImageToSnapshotConfig = comparator.diffImageToSnapshot.mock.calls[0][0];
    expect(diffImageToSnapshotConfig.snapshotsDir).toEqual(mockSnapshotsDir);
    expect(diffImageToSnapshotConfig.snapshotIdentifier).toEqual('pass');
    expect(diffImageToSnapshotConfig.baselineSnapshotPath).toEqual(path.join(mockSnapshotsDir, 'pass-snap.png'));
    expect(diffImageToSnapshotConfig.diffOutputPath).toEqual(path.join(mockSnapshotsDir, '__diff_output__', 'pass-diff.png'));
  });

  test('It should use pixelmatch when set', () => {
    diffImageToSnapshot({
      snapshotsDir: mockSnapshotsDir,
      snapshotIdentifier: 'pass',
      comparator: 'pixelmatch',
    });

    const comparator = require('../../src/comparators/pixelmatch'); // eslint-disable-line global-require
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();
  });

  test('It should throw and error with an unknown comparator', () => {
    expect(() => {
      diffImageToSnapshot({
        snapshotsDir: mockSnapshotsDir,
        snapshotIdentifier: 'pass',
        comparator: 'banana',
      });
    }).toThrow();
  });

  test('It should try to write a snapshot when the baseline doesn\'t exist', () => {
    diffImageToSnapshot({
      snapshotsDir: mockSnapshotsDir,
      snapshotIdentifier: 'not-exist',
      comparator: 'pixelmatch',
    });

    const comparator = require('../../src/comparators/pixelmatch'); // eslint-disable-line global-require
    expect(comparator.diffImageToSnapshot).not.toHaveBeenCalled();

    expect(mockMkdirpSync).toHaveBeenCalled();
    const mockMkdirpSyncPath = mockMkdirpSync.mock.calls[0][0];
    expect(mockMkdirpSyncPath).toEqual(mockSnapshotsDir);
  });

  test('It should try to write a snapshot when the baseline doesn\'t exist', () => {
    diffImageToSnapshot({
      snapshotsDir: mockSnapshotsDir,
      snapshotIdentifier: 'fail',
      comparator: 'pixelmatch',
      updateSnapshot: true
    });

    const comparator = require('../../src/comparators/pixelmatch'); // eslint-disable-line global-require
    expect(comparator.diffImageToSnapshot).not.toHaveBeenCalled();

    expect(mockMkdirpSync).toHaveBeenCalled();
    const mockMkdirpSyncPath = mockMkdirpSync.mock.calls[0][0];
    expect(mockMkdirpSyncPath).toEqual(mockSnapshotsDir);
  });
});
