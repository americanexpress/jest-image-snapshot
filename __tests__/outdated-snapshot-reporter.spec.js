/*
 * Copyright (c) 2020 American Express Travel Related Services Company, Inc.
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
const os = require('os');
const childProcess = require('child_process');
const path = require('path');

describe('OutdatedSnapshotReporter', () => {
  const jestImageSnapshotDir = path.join(__dirname, '..');
  const imagePath = path.join(__dirname, 'stubs/TestImage.png');
  const jestExe = process.platform === 'win32' ? 'jest.cmd' : 'jest';
  const jestBinPath = path.join(jestImageSnapshotDir, `node_modules/.bin/${jestExe}`);
  let tmpDir = os.tmpdir();

  function setupTestProject(dir) {
    const jestConfig = {
      reporters: [
        'default',
        `${jestImageSnapshotDir}/src/outdated-snapshot-reporter.js`,
      ],
    };
    const jestConfigFile = `module.exports = ${JSON.stringify(jestConfig)}`;

    const commonTest = `
    const fs = require('fs');
    const {toMatchImageSnapshot} = require('${jestImageSnapshotDir.replace(/\\/g, '/')}');
    expect.extend({toMatchImageSnapshot});
    `;
    const imageTest = `${commonTest}
    it('should run an image snapshot test', () => {
      expect(fs.readFileSync('image.png')).toMatchImageSnapshot();
    });
    `;
    const doubleTest = `${imageTest}
    it('should run an image snapshot test', () => {
      expect(fs.readFileSync('image.png')).toMatchImageSnapshot();
    });
    `;

    fs.writeFileSync(path.join(dir, 'jest.config.js'), jestConfigFile);
    fs.writeFileSync(path.join(dir, 'image.test.js'), imageTest);
    fs.writeFileSync(path.join(dir, 'double.test.js'), doubleTest);
    fs.copyFileSync(imagePath, path.join(dir, 'image.png'));
  }

  function runJest(cliArgs, environment = {}) {
    const child = childProcess.spawnSync(jestBinPath, cliArgs, {
      cwd: tmpDir,
      encoding: 'utf-8',
      env: { ...process.env, ...environment },
      shell: true,
    });
    if (child.error) throw child.error;

    return child;
  }

  function getSnapshotFiles() {
    return fs.readdirSync(path.join(tmpDir, '__image_snapshots__'));
  }

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'jest-image-snapshot-tests')
    );
    setupTestProject(tmpDir);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should write the image snapshot on first run', () => {
    const { status, stdout, stderr } = runJest(['-u']);
    expect(stderr).toContain('snapshots written');
    expect(status).toEqual(0);
    expect(stdout).toEqual('');

    expect(getSnapshotFiles()).toHaveLength(3);
  });

  it('should not delete the snapshot when environment flag is not enabled', () => {
    const { status, stdout } = runJest(['-u', 'image.test.js']);
    expect(status).toEqual(0);
    expect(stdout).toEqual('');

    expect(getSnapshotFiles()).toHaveLength(3);
  });

  it('should delete the snapshot when environment flag is enabled', () => {
    const { status, stdout, stderr } = runJest(['-u', 'image.test.js'], {
      JEST_IMAGE_SNAPSHOT_TRACK_OBSOLETE: '1',
    });
    expect(stderr).toContain('outdated snapshot');
    expect(status).toEqual(0);
    expect(stdout).toEqual('');

    expect(getSnapshotFiles()).toHaveLength(1);
  });
});
