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

const optional = require("optional");
const blinkDiffComparator = require("./comparators/blink-diff");
const pixelmatchComparator = require("./comparators/pixelmatch");

function diffImageToSnapshot(options) {
  const comparator = options["comparator"] || "blink-diff";

  var comparatorModule = null;

  switch(comparator) {
    case "pixelmatch":
      comparatorModule = pixelmatchComparator;
    break;
    case "blink-diff":
      comparatorModule = blinkDiffComparator
    break;
    default:
      throw Error("Unknown comparator: " + comparator);
    break;
  }

  if (comparatorModule) {
    return comparatorModule.diffImageToSnapshot(options);
  } 
  else {
    throw Error("Unable to load comparator: " + comparator);
  }
}

module.exports = {
  diffImageToSnapshot
};
