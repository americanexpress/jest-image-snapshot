# [4.2.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.1.0...v4.2.0) (2020-08-29)


### Features

* add obsolete snapshot reporting ([#222](https://github.com/americanexpress/jest-image-snapshot/issues/222)) ([47da7c2](https://github.com/americanexpress/jest-image-snapshot/commit/47da7c23495037e869ee68154218e5d73e1e8cd5))

# [4.1.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.0.2...v4.1.0) (2020-07-23)


### Features

* **ssim:** add integration ([#220](https://github.com/americanexpress/jest-image-snapshot/issues/220)) ([e2b304a](https://github.com/americanexpress/jest-image-snapshot/commit/e2b304a6c6aaf7e1d12c2e088105181ee108b960))

## [4.0.2](https://github.com/americanexpress/jest-image-snapshot/compare/v4.0.1...v4.0.2) (2020-05-27)


### Bug Fixes

* **options:** auto-detect colors if noColors option is not specified ([d90298c](https://github.com/americanexpress/jest-image-snapshot/commit/d90298c3f102734107a7574ddf0516c19a349c66))

## [4.0.1](https://github.com/americanexpress/jest-image-snapshot/compare/v4.0.0...v4.0.1) (2020-05-27)


### Bug Fixes

* **options:** add allowSizeMismatch arg ([6529ff4](https://github.com/americanexpress/jest-image-snapshot/commit/6529ff4b2bd9a20abe33d4b68d9d793198931f18))

# [4.0.0](https://github.com/americanexpress/jest-image-snapshot/compare/v3.1.0...v4.0.0) (2020-05-14)


### chore

* upgrade to jest 26 + drop node 8 support ([#205](https://github.com/americanexpress/jest-image-snapshot/issues/205)) ([4834533](https://github.com/americanexpress/jest-image-snapshot/commit/4834533369dae1533c93ad883e3f66617d7d9c3f))


### BREAKING CHANGES

* drop node 8 support

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
