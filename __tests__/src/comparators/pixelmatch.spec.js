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
const { ResultTypes } = require('../../../src/comparator-result'); 

describe('pixelmatch', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('diffImageToSnapshot', () => {
    const mockSnapshotsDir = path.normalize('./path/to/snapshots');
    const mockImageBuffer = fs.readFileSync('./__tests__/assets/sample.png');
    const mockPassImageBuffer = fs.readFileSync('./__tests__/assets/sample.png');
    const mockFailImageBuffer = fs.readFileSync('./__tests__/assets/fail.png');

    const mockMkdirpSync = jest.fn();

    const mockFs = Object.assign({}, fs, {
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      mkdirSync: jest.fn(),
      writeFileSync: jest.fn(),
    });

    jest.mock('fs', () => mockFs);
    jest.mock('mkdirp', () => ({ sync: mockMkdirpSync }));

    mockFs.existsSync.mockImplementation((p) => {
      let bn = path.basename(p);

      switch(bn) {
        case "pass-snap.png":
          return true;
        break;
        case "fail-snap.png":
          return true;
        break;
        case "not-exist-snap.png":
          return false;
        break;
      }

      switch (p) {
        case path.join(mockSnapshotsDir, '__diff_output__'):
          return !!outputDirExists;
        case mockSnapshotsDir:
          return !!snapshotDirExists;
        default:
          return !!defaultExists;
      }
    });
    mockFs.readFileSync.mockImplementation((p) => {
      let bn = path.basename(p);

      switch(bn) {
        case "pass-snap.png":
          return mockPassImageBuffer;
        break;
        case "fail-snap.png":
          return mockFailImageBuffer;
        break;
      }

      return null;
    });

    const { diffImageToSnapshot } = require('../../../src/comparators/pixelmatch');

    test('Should pass based on an exisiting snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'pass',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(result.result).toEqual(ResultTypes.PASS);
    });

    test('Should fail based on an exisiting snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'fail',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(result.result).toEqual(ResultTypes.FAIL);
    });

    test('Should request an update a failing snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'fail',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(result.result).toEqual(ResultTypes.UPDATE);
    });

    test('Should request an update a failing snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'fail',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(result.result).toEqual(ResultTypes.UPDATE);
    });

    test('Should request an update a passing snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'pass',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(result.result).toEqual(ResultTypes.UPDATE);
    });

    test('Should request add a new snapshot', () => {
      const result = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: 'not-exist',
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(result.result).toEqual(ResultTypes.ADD);
    });
  });
});
