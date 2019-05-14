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

describe('toMatchImageSnapshot', () => {
  function setupMock(diffImageToSnapshotResult) {
    jest.doMock('../src/diff-snapshot', () => ({
      runDiffImageToSnapshot: jest.fn(() => diffImageToSnapshotResult),
    }));

    const mockFs = Object.assign({}, fs, {
      existsSync: jest.fn(),
      unlinkSync: jest.fn(),
    });
    mockFs.existsSync.mockImplementation(p => p === 'test/path');
    jest.mock('fs', () => mockFs);

    return {
      mockFs,
    };
  }

  beforeEach(() => {
    // In tests, skip reporting (skip snapshotState update to not mess with our test report)
    global.UNSTABLE_SKIP_REPORTING = true;
    jest.resetModules();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.unmock('fs');
  });

  it('should throw an error if used with .not matcher', () => {
    const mockDiffResult = {
      pass: true,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0,
      diffPixelCount: 0,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').not.toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should pass when snapshot is similar enough or same as baseline snapshot', () => {
    const mockDiffResult = {
      pass: true,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0,
      diffPixelCount: 0,
    };
    setupMock(mockDiffResult);

    const { toMatchImageSnapshot } = require('../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .not.toThrow();
  });

  it('should fail when snapshot has a difference beyond allowed threshold', () => {
    const mockDiffResult = {
      pass: false,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.8,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrowErrorMatchingSnapshot();
  });

  it('should fail when snapshot is a different size than the baseline', () => {
    const mockDiffResult = {
      pass: false,
      diffSize: true,
      imageDimensions: {
        receivedHeight: 100,
        receivedWidth: 100,
        baselineHeight: 10,
        baselineWidth: 10,
      },
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.8,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
      .toThrow(/Expected image to be the same size as the snapshot/);
  });

  it('should use noColors options if passed as true and not style error message', () => {
    const mockDiffResult = {
      pass: false,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.4,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    expect.extend({ toMatchImageSnapshot });

    expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot({ noColors: true }))
      .toThrowErrorMatchingSnapshot();
  });

  it('should use custom pixelmatch configuration if passed in', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'new',
        updated: undefined,
        added: true,
      },
    };

    const mockDiffResult = {
      pass: false,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.8,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    const customDiffConfig = { threshold: 0.3 };
    matcherAtTest('pretendthisisanimagebuffer', { customDiffConfig });
    const { runDiffImageToSnapshot } = require('../src/diff-snapshot');
    expect(runDiffImageToSnapshot.mock.calls[0][0].customDiffConfig).toEqual(customDiffConfig);
  });

  it('passes diffImageToSnapshot everything it needs to create a snapshot and compare if needed', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'new',
        updated: undefined,
        added: true,
      },
    };

    const mockDiffResult = {
      pass: false,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.8,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer');
    const { runDiffImageToSnapshot } = require('../src/diff-snapshot');

    const dataArg = runDiffImageToSnapshot.mock.calls[0][0];
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
        _updateSnapshot: 'new',
        updated: undefined,
        added: true,
      },
    };

    const mockDiffResult = {
      pass: false,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0.8,
      diffPixelCount: 600,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    const { runDiffImageToSnapshot } = require('../src/diff-snapshot');

    expect(runDiffImageToSnapshot.mock.calls[0][0].snapshotIdentifier).toBe('custom-name');
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
    const mockDiffResult = { updated: true };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer');
    const { runDiffImageToSnapshot } = require('../src/diff-snapshot');

    expect(runDiffImageToSnapshot.mock.calls[0][0].updateSnapshot).toBe(true);
  });

  it('should work when a new snapshot is added', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        update: false,
        _updateSnapshot: 'new',
        updated: undefined,
        added: true,
      },
    };
    const mockDiff = jest.fn();
    jest.doMock('../src/diff-snapshot', () => ({
      runDiffImageToSnapshot: mockDiff,
    }));

    const mockFs = Object.assign({}, fs, {
      existsSync: jest.fn(),
      unlinkSync: jest.fn(),
    });

    mockFs.existsSync.mockReturnValueOnce(false);
    mockDiff.mockReturnValueOnce({ added: true });

    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);
    expect(matcherAtTest('pretendthisisanimagebuffer')).toHaveProperty('pass', true);
    expect(mockDiff).toHaveBeenCalled();
  });

  it('should fail when a new snapshot is added in ci', () => {
    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        update: false,
        _updateSnapshot: 'none',
        updated: undefined,
        added: true,
      },
    };

    const mockDiff = jest.fn();
    jest.doMock('../src/diff-snapshot', () => ({
      diffImageToSnapshot: mockDiff,
    }));

    const mockFs = Object.assign({}, fs, {
      existsSync: jest.fn(),
      unlinkSync: jest.fn(),
    });

    mockFs.existsSync.mockReturnValueOnce(false);


    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);
    const result = matcherAtTest('pretendthisisanimagebuffer');
    expect(result).toHaveProperty('pass', false);
    expect(result).toHaveProperty('message');
    expect(result.message()).toContain('continuous integration');
    expect(mockDiff).not.toHaveBeenCalled();
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
    const mockDiffResult = { updated: true };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);
    expect(() => matcherAtTest('pretendthisisanimagebuffer')).not.toThrow();
  });

  it('can provide custom defaults', () => {
    const mockTestContext = {
      testPath: path.join('path', 'to', 'test.spec.js'),
      currentTestName: 'test1',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        update: true,
        updated: undefined,
        added: undefined,
      },
    };
    setupMock({ updated: true });

    const runDiffImageToSnapshot = jest.fn(() => ({}));
    jest.doMock('../src/diff-snapshot', () => ({
      runDiffImageToSnapshot,
    }));

    const Chalk = jest.fn();
    jest.doMock('chalk', () => ({
      constructor: Chalk,
    }));
    const { configureToMatchImageSnapshot } = require('../src/index');
    const customConfig = { perceptual: true };
    const toMatchImageSnapshot = configureToMatchImageSnapshot({
      customDiffConfig: customConfig,
      customSnapshotsDir: path.join('path', 'to', 'my-custom-snapshots-dir'),
      customDiffDir: path.join('path', 'to', 'my-custom-diff-dir'),
      noColors: true,
    });
    expect.extend({ toMatchImageSnapshot });
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest();

    expect(runDiffImageToSnapshot).toHaveBeenCalledWith({
      customDiffConfig: {
        perceptual: true,
      },
      snapshotIdentifier: 'test-spec-js-test-1-1',
      snapshotsDir: path.join('path', 'to', 'my-custom-snapshots-dir'),
      diffDir: path.join('path', 'to', 'my-custom-diff-dir'),
      diffDirection: 'horizontal',
      updateSnapshot: false,
      updatePassedSnapshot: false,
      failureThreshold: 0,
      failureThresholdType: 'pixel',
    });
    expect(Chalk).toHaveBeenCalledWith({
      enabled: false,
    });
  });

  it('should only increment matched when test passed', () => {
    global.UNSTABLE_SKIP_REPORTING = false;

    const mockTestContext = {
      testPath: 'path/to/test.spec.js',
      currentTestName: 'test',
      isNot: false,
      snapshotState: {
        _counters: new Map(),
        _updateSnapshot: 'new',
        updated: undefined,
        added: true,
        unmatched: 0,
        matched: 0,
      },
    };

    const mockDiffResult = {
      pass: true,
      diffOutputPath: 'path/to/result.png',
      diffRatio: 0,
      diffPixelCount: 0,
    };

    setupMock(mockDiffResult);
    const { toMatchImageSnapshot } = require('../src/index');
    const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
    expect(mockTestContext.snapshotState.matched).toBe(4);
  });

  describe('when retryTimes is set', () => {
    beforeEach(() => { global[Symbol.for('RETRY_TIMES')] = 3; });
    afterEach(() => { global[Symbol.for('RETRY_TIMES')] = undefined; });

    it('should throw an error when called without customSnapshotIdentifier', () => {
      const mockDiffResult = {
        pass: true,
        diffOutputPath: 'path/to/result.png',
        diffRatio: 0,
        diffPixelCount: 0,
      };

      setupMock(mockDiffResult);
      const { toMatchImageSnapshot } = require('../src/index');
      expect.extend({ toMatchImageSnapshot });

      expect(() => expect('pretendthisisanimagebuffer').toMatchImageSnapshot())
        .toThrowErrorMatchingSnapshot();
    });

    it('should only increment unmatched when test fails in excess of retryTimes', () => {
      global.UNSTABLE_SKIP_REPORTING = false;

      const mockTestContext = {
        testPath: 'path/to/test.spec.js',
        currentTestName: 'test',
        isNot: false,
        snapshotState: {
          _counters: new Map(),
          _updateSnapshot: 'new',
          updated: undefined,
          added: true,
          unmatched: 0,
        },
      };

      const mockDiffResult = {
        pass: false,
        diffOutputPath: 'path/to/result.png',
        diffRatio: 0.8,
        diffPixelCount: 600,
      };

      setupMock(mockDiffResult);
      const { toMatchImageSnapshot } = require('../src/index');
      const matcherAtTest = toMatchImageSnapshot.bind(mockTestContext);

      matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
      matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
      matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
      matcherAtTest('pretendthisisanimagebuffer', { customSnapshotIdentifier: 'custom-name' });
      expect(mockTestContext.snapshotState.unmatched).toBe(1);
    });
  });
});

describe('updateSnapshotState', () => {
  it('mutates original state', () => {
    const { updateSnapshotState } = require('../src/index');
    global.UNSTABLE_SKIP_REPORTING = false;
    const originalState = { some: 'value' };
    updateSnapshotState(originalState, { another: 'val' });

    expect(originalState).toEqual({ some: 'value', another: 'val' });
  });
});
