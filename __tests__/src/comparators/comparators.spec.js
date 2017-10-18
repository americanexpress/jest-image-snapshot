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
const { ResultTypes } = require('../../../src/comparator-result');

describe('Comparators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSnapshotsDir = path.normalize('./path/to/snapshots');
  const mockPassImagePath = './__tests__/assets/pass.png';
  const mockPassImageBuffer = fs.readFileSync(mockPassImagePath);
  const mockFailImagePath = './__tests__/assets/fail.png';
  const mockFailImageBuffer = fs.readFileSync(mockFailImagePath);
  const mockDiffOutputDir = path.join(mockSnapshotsDir, '__diff_output__');

  const mockMkdirpSync = jest.fn();

  const mockFs = Object.assign({}, fs, {
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
  });

  jest.mock('fs', () => mockFs);
  jest.mock('mkdirp', () => ({ sync: mockMkdirpSync }));

  mockFs.readFileSync.mockImplementation((p) => {
    const bn = path.basename(p);

    switch (bn) {
      case 'pass.png':
        return mockPassImageBuffer;
      case 'fail.png':
        return mockFailImageBuffer;

      case 'pass-snap.png':
        return mockPassImageBuffer;
      case 'fail-snap.png':
        return mockFailImageBuffer;

      default:
        return null;
    }
  });

  const comparators = ['pixelmatch', 'blink-diff'];

  comparators.forEach((comparator) => {
    describe(comparator, () => {
      /* eslint-disable */
      const { diffImageToSnapshot } = require(`../../../src/comparators/${comparator}`);
      /* eslint-enable */

      test('Should pass based on an exisiting snapshot', () => {
        const result = diffImageToSnapshot({
          imageData: mockPassImageBuffer,
          baselineSnapshotPath: mockPassImagePath,
          diffOutputPath: path.join(mockDiffOutputDir, 'foo-diff.png'),
        });

        // expect(mockFs.writeFileSync).toHaveBeenCalled();
        expect(result.result).toEqual(ResultTypes.PASS);
        expect(result.percentDiff).toBeLessThan(0.05);
        expect(result.pixelCountDiff).toBeLessThan(10);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      test('Should fail based on an exisiting snapshot', () => {
        const result = diffImageToSnapshot({
          imageData: mockPassImageBuffer,
          baselineSnapshotPath: mockFailImagePath,
          diffOutputPath: path.join(mockDiffOutputDir, 'foo-diff.png'),
        });

        // expect(mockFs.writeFileSync).toHaveBeenCalled();
        expect(result.result).toEqual(ResultTypes.FAIL);
        expect(result.percentDiff).toBeGreaterThan(0.05);
        expect(result.pixelCountDiff).toBeGreaterThan(10000);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });
    });
  });
});
