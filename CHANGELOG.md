# [3.1.0](https://github.com/americanexpress/jest-image-snapshot/compare/v3.0.1...v3.1.0) (2020-04-17)


### Features

* **options:** add option to pass on size missmatch ([#174](https://github.com/americanexpress/jest-image-snapshot/issues/174)) ([cee46b1](https://github.com/americanexpress/jest-image-snapshot/commit/cee46b1fc94f962c34900a8b655d22665cea2854)), closes [#83](https://github.com/americanexpress/jest-image-snapshot/issues/83) [#85](https://github.com/americanexpress/jest-image-snapshot/issues/85)

## [3.0.1](https://github.com/americanexpress/jest-image-snapshot/compare/v3.0.0...v3.0.1) (2020-03-25)


### Performance Improvements

* **diff-snapshot:** remove logic to bypass diff for identical images ([1be1b00](https://github.com/americanexpress/jest-image-snapshot/commit/1be1b006220b4144f98ad583c8cd6ff629aec7b3))

# [3.0.0](https://github.com/americanexpress/jest-image-snapshot/compare/v2.12.0...v3.0.0) (2020-03-24)


### Bug Fixes

* **diff:** small default maxBuffer ([df713f6](https://github.com/americanexpress/jest-image-snapshot/commit/df713f6afb7ec7130ec07e94d6a137a3ea62c5de))
* **diff-snapshot:** dumpDiffToConsole base64 string output ([#183](https://github.com/americanexpress/jest-image-snapshot/issues/183)) ([f73079f](https://github.com/americanexpress/jest-image-snapshot/commit/f73079f42f86696831ebe85d718e27d6f1d048c0))


### chore

* **packages:** updating jest to 25.1 for perf improvements ([#170](https://github.com/americanexpress/jest-image-snapshot/issues/170)) ([eb3dfa6](https://github.com/americanexpress/jest-image-snapshot/commit/eb3dfa605c0344ac4dc42cb7f9f76a5e4a732592))
* **packages:** upgrade from pixelmatch 4.x to 5.x, and pngjs to 3.4 ([#186](https://github.com/americanexpress/jest-image-snapshot/issues/186)) ([1edc9a3](https://github.com/americanexpress/jest-image-snapshot/commit/1edc9a31db2130b1eafb45738ebc81fa544d380f))
* **travis:** remove node 6 from travis config ([ce2b757](https://github.com/americanexpress/jest-image-snapshot/commit/ce2b757a6f337ac156e901a0f1e2851f94d0e7b2))


### Features

* **diff:** increase the maxBuffer to 10MB for the diff process ([#167](https://github.com/americanexpress/jest-image-snapshot/issues/167)) ([0927826](https://github.com/americanexpress/jest-image-snapshot/commit/0927826776e5fee04ea98cba5cd792aa5066e1fd))


### BREAKING CHANGES

* **packages:** pixelmatch is being major version bumped and so image diffs may be difference
* **packages:** Node min version is now 8
* **travis:** drop support for node 6
