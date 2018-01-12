/*
 * Copyright (c) 2018 American Express Travel Related Services Company, Inc.
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

it('works reading an image from the local file system', () => {
  const imageAtTestPath = path.resolve(__dirname, './stubs', 'image.png');
  // imageAtTest is a PNG encoded image buffer which is what `toMatchImageSnapshot() expects
  const imageAtTest = fs.readFileSync(imageAtTestPath);

  expect(imageAtTest).toMatchImageSnapshot();
});
