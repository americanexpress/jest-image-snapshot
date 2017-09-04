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

describe('toMatchImageSnapshot', () => {

  jest.mock('../../src/comparators/blink-diff');
  jest.mock('../../src/comparators/pixelmatch');

  const { diffImageToSnapshot } = require('../../src/diff-snapshot');
  const blinkDiffComparator = require('../../src/comparators/blink-diff');
  const pixelmatchComparator = require('../../src/comparators/pixelmatch');

  test("It should use blink-diff by default", () => {
    diffImageToSnapshot({});

    const comparator = require('../../src/comparators/blink-diff');
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();
  });

  test("It should use blink-diff when set", () => {
    diffImageToSnapshot({ "comparator" : "blink-diff"});

    const comparator = require('../../src/comparators/blink-diff');
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();
  });

  test("It should use pixelmatch when set", () => {
    diffImageToSnapshot({ "comparator" : "pixelmatch"});

    const comparator = require('../../src/comparators/pixelmatch');
    expect(comparator.diffImageToSnapshot).toHaveBeenCalled();
  });

  test("It should throw and error with an unknown comparator", () => {
    expect(() => {
      diffImageToSnapshot({ "comparator" : "banana"});

    }).toThrow();
  });
});