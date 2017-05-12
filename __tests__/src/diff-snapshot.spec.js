const fs = require('fs');

const mockRunSync = jest.fn(() => {});

jest.mock('blink-diff', () => jest.fn(() => ({
  runSync: mockRunSync,
})));

describe('diff-snapshot', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should have a list of unsupported blink diff custom configurations', () => {
    const { unsupportedDiffConfigKeys } = require('../../src/diff-snapshot');

    expect(unsupportedDiffConfigKeys).toMatchSnapshot();
  });

  describe('isDiffConfigValid', () => {
    const { isDiffConfigValid } = require('../../src/diff-snapshot');

    it('returns false if any configuration passed is included in the list of unsupported configurations', () => {
      expect(isDiffConfigValid({ imageOutputPath: 'path/to/output.png' })).toBe(false);
    });

    it('returns true if no configuration passed is included in the list of unsupported configurations', () => {
      expect(isDiffConfigValid({ supportedConfiguration: true })).toBe(true);
    });
  });

  describe('diffImageToSnapshot', () => {
    const mockSnapshotsDir = '/path/to/snapshots';
    const mockSnapshotIdentifier = 'id1';
    const mockImageBuffer = 'pretendthisisimagebufferandnotjustastring';
    const mockMkdirSync = jest.fn();
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
      const { diffImageToSnapshot } = require('../../src/diff-snapshot');

      mockFs.existsSync.mockImplementation((path) => {
        switch (path) {
          case `${mockSnapshotsDir}/${mockSnapshotIdentifier}-snap.png`:
            return snapshotExists;
          case `${mockSnapshotsDir}/__diff_output__`:
            return !!outputDirExists;
          case mockSnapshotsDir:
            return !!snapshotDirExists;
          default:
            return !!defaultExists;
        }
      });

      return diffImageToSnapshot;
    }

    it('should throw if an unsupported configuration is passed', () => {
      const diffImageToSnapshot = setupTest({});
      expect(() =>
        diffImageToSnapshot({
          imageData: mockImageBuffer,
          snapshotIdentifier: mockSnapshotIdentifier,
          snapshotsDir: mockSnapshotsDir,
          customDiffConfig: {
            imageOutputPath: 'path/to/output/dir',
          },
        })
      ).toThrowErrorMatchingSnapshot();
    });

    it('should run comparison if there is already a snapshot stored and updateSnapshot flag is not set', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockRunSync).toHaveBeenCalled();
    });

    it('should merge custom configuration with default configuration if custom config is passed', () => {
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
        imageBPath: `${mockSnapshotsDir}/${mockSnapshotIdentifier}-snap.png`,
        threshold: 0.01,
        imageOutputPath: `${mockSnapshotsDir}/__diff_output__/${mockSnapshotIdentifier}-diff.png`,
        thresholdType: 'percent',
      });
    });

    it('should create diff output directory if there is not one already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockMkdirSync).toHaveBeenCalledWith(`${mockSnapshotsDir}/__diff_output__`);
    });

    it('should not create diff output directory if there is one there already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, outputDirExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(`${mockSnapshotsDir}/__diff_output__`);
    });

    it('should create snapshots directory is there is not one already', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(mockMkdirSync).toHaveBeenCalledWith(mockSnapshotsDir);
    });

    it('should not create snapshots directory if there already is one', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true, snapshotDirExists: true });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(mockMkdirSync).not.toHaveBeenCalledWith(mockSnapshotsDir);
    });

    it('should create snapshot in __image_snapshots__ directory if there is not a snapshot created yet', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false, snapshotDirExists: false });
      diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(mockWriteFileSync).toHaveBeenCalledWith(`${mockSnapshotsDir}/${mockSnapshotIdentifier}-snap.png`, mockImageBuffer);
    });

    it('should return updated flag is snapshot was updated', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: true,
      });

      expect(diffResult).toHaveProperty('updated', true);
    });

    it('should return added flag is snapshot was added', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: false });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(diffResult).toHaveProperty('added', true);
    });

    it('should return path to comparison output image if a comparison was performed', () => {
      const diffImageToSnapshot = setupTest({ snapshotExists: true });
      const diffResult = diffImageToSnapshot({
        imageData: mockImageBuffer,
        snapshotIdentifier: mockSnapshotIdentifier,
        snapshotsDir: mockSnapshotsDir,
        updateSnapshot: false,
      });

      expect(diffResult).toHaveProperty('diffOutputPath', `${mockSnapshotsDir}/__diff_output__/${mockSnapshotIdentifier}-diff.png`);
    });
  });
});
