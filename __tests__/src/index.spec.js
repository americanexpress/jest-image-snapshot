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

describe('toMatchImageSnapshot', () => {
  function setupMock(diffImageToSnapshotResult) {
    jest.doMock('../../src/diff-snapshot', () => ({
      diffImageToSnapshot: jest.fn(() => diffImageToSnapshotResult),
    }));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should throw an error if used with .not matcher', () => {
    const mockDiffResult = { updated: false, code: 7 };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').not.toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should pass when snapshot is similar enough or same as baseline snapshot', () => {
    const mockDiffResult = { updated: false, code: 7 };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .not.toThrow();
  });

  it('should fail when snapshot has a difference beyond allowed threshold', () => {
    // code 1 is result too different: https://github.com/yahoo/blink-diff/blob/master/index.js#L267
    const mockDiffResult = { updated: false, code: 1, diffOutputPath: 'path/to/result.png' };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });


    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should fail when diff result is unknown', () => {
    // code 0 is unknown result: https://github.com/yahoo/blink-diff/blob/master/index.js#L258
    const mockDiffResult = { updated: false, code: 0, diffOutputPath: 'path/to/result.png' };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });


    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should use custom blink-diff configuration if passed in', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _updateSnapshot: 'none',
        updated: undefined,
        added: true,
      },
    };
    const mockDiffResult = { updated: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    const customDiffConfig = { threshold: 0.3 };
    matcherAtTest('pretendthisisanimagebuffer', customDiffConfig);
    const { diffImageToSnapshot } = require('../../src/diff-snapshot');
    expect(diffImageToSnapshot.mock.calls[0][0].customDiffConfig).toBe(customDiffConfig);
  });

  it('passes diffImageToSnapshot everything it needs to create a snapshot and compare if needed', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _updateSnapshot: 'none',
        updated: undefined,
        added: true,
      },
    };
    const mockDiffResult = { updated: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    const customDiffConfig = { threshold: 0.3 };
    matcherAtTest('pretendthisisanimagebuffer', customDiffConfig);
    const { diffImageToSnapshot } = require('../../src/diff-snapshot');

    expect(diffImageToSnapshot.mock.calls[0][0]).toMatchSnapshot();
  });

  it('attempts to update snapshots if snapshotState has updateSnapshot flag set', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _updateSnapshot: 'all',
        updated: undefined,
        added: true,
      },
    };
    const mockDiffResult = { updated: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer');
    const { diffImageToSnapshot } = require('../../src/diff-snapshot');

    expect(diffImageToSnapshot.mock.calls[0][0].updateSnapshot).toBe(true);
  });

  it('should work when a new snapshot is added', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        update: false,
        updated: undefined,
        added: true,
      },
    };
    const mockDiffResult = { added: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);
    expect(() => matcherAtTest('pretendthisisanimagebuffer')).not.toThrow();
  });

  it('should work when a snapshot is updated', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        update: true,
        updated: undefined,
        added: undefined,
      },
    };
    const mockDiffResult = { updated: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);
    expect(() => matcherAtTest('pretendthisisanimagebuffer')).not.toThrow();
  });
});
