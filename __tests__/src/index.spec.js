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
const { ResultTypes, ComparatorResult } = require('../../src/comparator-result');

describe('toMatchImageSnapshot', () => {
  function setupMock(diffImageToSnapshotResult) {
    jest.doMock('../../src/diff-snapshot', () => ({
      diffImageToSnapshot: jest.fn(() => diffImageToSnapshotResult),
    }));

    const mockFs = Object.assign({}, fs, {
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      unlinkSync: jest.fn(),
      existsSync: jest.fn(),
    });

    mockFs.existsSync.mockImplementation((p) => {
      const bn = path.basename(p);

      switch (bn) {
        case 'result.png':
          return true;
        default:
          return false;
      }
    });
  
    jest.mock('fs', () => mockFs);
  }

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should throw an error if used with .not matcher', () => {
    const mockDiffResult = new ComparatorResult(ResultTypes.PASS);
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').not.toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should pass when snapshot is similar enough or same as baseline snapshot', () => {
    const mockDiffResult = new ComparatorResult(ResultTypes.PASS, 0, 0, 'path/to/result.png');
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .not.toThrow();
  });

  it('should fail when snapshot has a difference beyond allowed threshold', () => {
    // code 1 is result too different: https://github.com/yahoo/blink-diff/blob/master/index.js#L267
    const mockDiffResult = new ComparatorResult(ResultTypes.FAIL, 0.40231, 3524, 'path/to/result.png');
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should use noColors options if passed as true and not style error message', () => {
    // code 1 is result too different: https://github.com/yahoo/blink-diff/blob/master/index.js#L267
    const mockDiffResult = new ComparatorResult(ResultTypes.FAIL, 0.6, 35624, 'path/to/result.png');
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });


    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot({ noColors: true }))
      .toThrowErrorMatchingSnapshot();
  });

  it('attempts to update snapshots if snapshotState has updateSnapshot flag set', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'all',
        updated: 0,
        added: 0,
      },
    };
    const mockDiffResult = new ComparatorResult(ResultTypes.UPDATE, 0.6, 35624, 'path/to/result.png');
    
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer');
    expect(mockTestContext.snapshotState.updated).toBe(1);
    expect(mockTestContext.snapshotState.added).toBe(0);
  });

  it('attempts to add snapshots if missing', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test2',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'all',
        updated: 0,
        added: 0,
      },
    };
    const mockDiffResult = new ComparatorResult(ResultTypes.ADD, 0.6, 35624, 'path/to/result.png');
    
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer');
    expect(mockTestContext.snapshotState.updated).toBe(0);
    expect(mockTestContext.snapshotState.added).toBe(1);
  });

  it('should attempt to delete the diffs of passing snapshots', () => {
    const mockDiffResult = new ComparatorResult(ResultTypes.PASS, 0, 0, 'path/to/result.png');
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot({ cleanPassingDiffs: true }))
      .not.toThrow();

    const fs = require('fs');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
