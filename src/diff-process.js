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

const getStdin = require('get-stdin');

const { diffImageToSnapshot } = require('./diff-snapshot');

getStdin.buffer().then((buffer) => {
  try {
    const options = JSON.parse(buffer);

    options.receivedImageBuffer = Buffer.from(options.receivedImageBuffer, 'base64');

    const result = diffImageToSnapshot(options);

    fs.writeSync(3, Buffer.from(JSON.stringify(result)));

    process.exit(0);
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  }
});
