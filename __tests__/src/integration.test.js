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
const rimraf = require('rimraf');

describe('integration', () => {
  const mockPassImagePath = './__tests__/assets/pass.png';
  const mockPassImageBuffer = fs.readFileSync(mockPassImagePath);
  const mockFailImagePath = './__tests__/assets/fail.png';
  const mockFailImageBuffer = fs.readFileSync(mockFailImagePath);

  let mockFs;
  let mockPixelMatch;
  let mockBlinkDiffRunSync;

  beforeAll(() => {
    rimraf.sync('./__tests__/src/__image_snapshots__');

    // These are a series of interception mocks to make sure we're
    // calling the correct underlying methods
    mockFs = Object.assign({}, fs, {
      writeFileSync: jest.fn(),
    });
    mockFs.writeFileSync.mockImplementation(function (...args) { // eslint-disable-line func-names
      fs.writeFileSync.apply(this, args);
    });
    jest.mock('fs', () => mockFs);

    const pixelmatch = require.requireActual('pixelmatch'); // eslint-disable-line global-require
    mockPixelMatch = jest.fn();
    mockPixelMatch.mockImplementation(function (...args) { // eslint-disable-line func-names
      return pixelmatch.apply(this, args);
    });
    jest.mock('pixelmatch', () => mockPixelMatch);

    const BlinkDiff = require('blink-diff'); // eslint-disable-line global-require
    const oldRunSync = BlinkDiff.prototype.runSync;
    mockBlinkDiffRunSync = jest.fn();
    mockBlinkDiffRunSync.mockImplementation(function (...args) { // eslint-disable-line func-names
      return oldRunSync.apply(this, args);
    });
    BlinkDiff.prototype.runSync = mockBlinkDiffRunSync;

    const { toMatchImageSnapshot } = require('../../src/index'); // eslint-disable-line global-require
    expect.extend({ toMatchImageSnapshot });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should diff using blink-diff', () => {
    // First pass we write the diffs
    expect(() => expect(mockPassImageBuffer).toMatchImageSnapshot({
      customSnapshotIdentifier: 'integration--blink-diff',
    }))
      .not.toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(0);
    expect(mockPixelMatch).toHaveBeenCalledTimes(0);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);

    // Second pass we compare and write a diff image
    expect(() => expect(mockPassImageBuffer).toMatchImageSnapshot({
      customSnapshotIdentifier: 'integration--blink-diff',
    }))
      .not.toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(1);
    expect(mockPixelMatch).toHaveBeenCalledTimes(0);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);

    // Third pass we compare and fail
    expect(() => expect(mockFailImageBuffer).toMatchImageSnapshot({
      customSnapshotIdentifier: 'integration--blink-diff',
    }))
      .toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(2);
    expect(mockPixelMatch).toHaveBeenCalledTimes(0);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
  });

  it('Should diff using pixelmatch', () => {
    // First pass we write the diffs
    expect(() => expect(mockPassImageBuffer).toMatchImageSnapshot({
      comparator: 'pixelmatch',
      customSnapshotIdentifier: 'integration--pixelmatch',
    }))
      .not.toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(0);
    expect(mockPixelMatch).toHaveBeenCalledTimes(0);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);

    // Second pass we compare and write a diff image
    expect(() => expect(mockPassImageBuffer).toMatchImageSnapshot({
      comparator: 'pixelmatch',
      customSnapshotIdentifier: 'integration--pixelmatch',
    }))
      .not.toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(0);
    expect(mockPixelMatch).toHaveBeenCalledTimes(1);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);

    // Third pass we compare and fail
    expect(() => expect(mockFailImageBuffer).toMatchImageSnapshot({
      comparator: 'pixelmatch',
      customSnapshotIdentifier: 'integration--pixelmatch',
    }))
      .toThrowError();
    expect(mockBlinkDiffRunSync).toHaveBeenCalledTimes(0);
    expect(mockPixelMatch).toHaveBeenCalledTimes(2);
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
  });
});
