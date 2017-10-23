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
const toMatchImageSnapshot = require('../../src').toMatchImageSnapshot;

expect.extend({ toMatchImageSnapshot });

describe('integration tests', () => {
  const imagePath = path.resolve(__dirname, '../stubs', 'TestImage.png');
  const imageData = fs.readFileSync(imagePath);

  it('writes a snapshot with no error.', () => {
    fs.unlink('./__tests__/src/__image_snapshots__/integration-snap.png');

    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier: 'integration' })).not.toThrowError();
  });

  it('matches an identical snapshot.', () => {
    expect(() => expect(imageData).toMatchImageSnapshot({ customSnapshotIdentifier: 'integration' })).not.toThrowError();
  });

  it('fails with a different snapshot.', () => {
    const failImagePath = path.resolve(__dirname, '../stubs', 'TestImageFailure.png');
    const failImageData = fs.readFileSync(failImagePath);

    expect(() => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier: 'integration' })).toThrowError();
  });

  it('fails gracefully with a differently sized image.', () => {
    const failImagePath = path.resolve(__dirname, '../stubs', 'TestImageFailureOversize.png');
    const failImageData = fs.readFileSync(failImagePath);

    expect(() => expect(failImageData).toMatchImageSnapshot({ customSnapshotIdentifier: 'integration' })).toThrowError();
  });
});
