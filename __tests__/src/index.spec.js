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

describe('toMatchImageSnapshot', () => {
  function setupMock(diffImageToSnapshotResult) {
    jest.doMock('../../src/diff-snapshot', () => ({
      diffImageToSnapshot: jest.fn(() => diffImageToSnapshotResult),
    }));

    const mockFs = Object.assign({}, fs, {
      existsSync: jest.fn(),
      unlinkSync: jest.fn(),
    });
    mockFs.existsSync.mockImplementation(path => path === 'test/path');
    jest.mock('fs', () => mockFs);

    return {
      mockFs,
    };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.unmock('fs');
  });

  it('should throw an error if used with .not matcher', () => {
    const mockDiffResult = { updated: false, pass: false };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').not.toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should pass when snapshot is similar enough or same as baseline snapshot', () => {
    const mockDiffResult = { updated: false, pass: false, diffOutputPath: 'test/path' };
    const { mockFs } = setupMock(mockDiffResult);

    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .not.toThrow();
    expect(mockFs.unlinkSync).toHaveBeenCalledWith('test/path');
  });

  it('should fail when snapshot has a difference beyond allowed threshold', () => {
    // code 1 is result too different: https://github.com/yahoo/blink-diff/blob/master/index.js#L267
    const mockDiffResult = { updated: false, pass: true, diffOutputPath: 'path/to/result.png' };
    const { mockFs } = setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
    expect(mockFs.unlinkSync).not.toHaveBeenCalledWith('test/path');
  });

  it('should use noColors options if passed as true and not style error message', () => {
    // code 1 is result too different: https://github.com/yahoo/blink-diff/blob/master/index.js#L267
    const mockDiffResult = { updated: false, pass: false, diffOutputPath: 'path/to/result.png', percentDiff: 0.4 };
    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    expect.extend({ toMatchImageSnapshot });


    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot({ noColors: true }))
      .toThrowErrorMatchingSnapshot();
  });

  it('should use custom blink-diff configuration if passed in', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
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
    matcherAtTest('pretendthisisanimagebuffer', { customDiffConfig });
    const { diffImageToSnapshot } = require('../../src/diff-snapshot');
    expect(diffImageToSnapshot.mock.calls[0][0].customDiffConfig).toBe(customDiffConfig);
  });

  it('passes diffImageToSnapshot everything it needs to create a snapshot and compare if needed', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'none',
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

    const dataArg = diffImageToSnapshot.mock.calls[0][0];
    // This is to make the test work on windows
    dataArg.snapshotsDir = dataArg.snapshotsDir.replace(/\\/g, '/');

    expect(dataArg).toMatchSnapshot();
  });

  it('passes uses user passed snapshot name if given', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'none',
        updated: undefined,
        added: true,
      },
    };
    const mockDiffResult = { updated: true, code: 7 };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    const { diffImageToSnapshot } = require('../../src/diff-snapshot');

    expect(diffImageToSnapshot.mock.calls[0][0].snapshotIdentifier).toBe('custom-name');
  });

  it('attempts to update snapshots if snapshotState has updateSnapshot flag set', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
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
        _counters: new Map(),
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
        _counters: new Map(),
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
