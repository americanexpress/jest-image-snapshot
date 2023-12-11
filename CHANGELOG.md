# [6.4.0](https://github.com/americanexpress/jest-image-snapshot/compare/v6.3.0...v6.4.0) (2023-12-11)


### Features

* add configurable maxBuffer option to runDiffImageToSnapshot ([#344](https://github.com/americanexpress/jest-image-snapshot/issues/344)) ([befad8b](https://github.com/americanexpress/jest-image-snapshot/commit/befad8ba6080be6b0a94d098334ea05258afab2e))

# [6.3.0](https://github.com/americanexpress/jest-image-snapshot/compare/v6.2.0...v6.3.0) (2023-11-28)


### Features

* Add `runtimeHooksPath` options ([#337](https://github.com/americanexpress/jest-image-snapshot/issues/337)) ([57741a2](https://github.com/americanexpress/jest-image-snapshot/commit/57741a242cd2192c453a87c34fa89c7c35a0763c))

# [6.2.0](https://github.com/americanexpress/jest-image-snapshot/compare/v6.1.1...v6.2.0) (2023-07-25)


### Features

* allow configuration of postfix for received screenshots filename ([#328](https://github.com/americanexpress/jest-image-snapshot/issues/328)) ([bade294](https://github.com/americanexpress/jest-image-snapshot/commit/bade294ec2843c62b1dbcbf894faffd3a5708b98))

## [6.1.1](https://github.com/americanexpress/jest-image-snapshot/compare/v6.1.0...v6.1.1) (2023-07-25)


### Bug Fixes

* only updatePassedSnapshot if updateSnapshot is also true ([#327](https://github.com/americanexpress/jest-image-snapshot/issues/327)) ([b9d9c3f](https://github.com/americanexpress/jest-image-snapshot/commit/b9d9c3f16ab0e10a3e1320d03efb52e81675d2aa)), closes [#320](https://github.com/americanexpress/jest-image-snapshot/issues/320) [#322](https://github.com/americanexpress/jest-image-snapshot/issues/322) [#324](https://github.com/americanexpress/jest-image-snapshot/issues/324)

# [6.1.0](https://github.com/americanexpress/jest-image-snapshot/compare/v6.0.0...v6.1.0) (2022-12-02)


### Features

* add onlyDiff in options ([#317](https://github.com/americanexpress/jest-image-snapshot/issues/317)) ([4bad752](https://github.com/americanexpress/jest-image-snapshot/commit/4bad752571bb567861ddfa2cc9073f33c4239352))

# [6.0.0](https://github.com/americanexpress/jest-image-snapshot/compare/v5.2.0...v6.0.0) (2022-11-03)


* chore(jest)!: add support for jest v29 (#309) ([79e53fc](https://github.com/americanexpress/jest-image-snapshot/commit/79e53fc010793f574cd9da783ced895af6987712)), closes [#309](https://github.com/americanexpress/jest-image-snapshot/issues/309)


### BREAKING CHANGES

* Drop support for Node v12 and Node v17,
                 as Jest v29 does not support these versions.

* ci(release): use Node v16 for release action

Node v16 is the current active LTS release of Node.JS

Co-authored-by: Jamie King <hello@jamieking.me>

Co-authored-by: Jamie King <hello@jamieking.me>

# [5.2.0](https://github.com/americanexpress/jest-image-snapshot/compare/v5.1.1...v5.2.0) (2022-08-31)


### Features

* remove snap suffix if use custom identifier ([#305](https://github.com/americanexpress/jest-image-snapshot/issues/305)) ([775ac0a](https://github.com/americanexpress/jest-image-snapshot/commit/775ac0a7dff33da9719b1dc36b9e382dc10a82a1))

## [5.1.1](https://github.com/americanexpress/jest-image-snapshot/compare/v5.1.0...v5.1.1) (2022-08-25)


### Bug Fixes

* **diff-snapshot:** make recievedDir optional ([#306](https://github.com/americanexpress/jest-image-snapshot/issues/306)) ([cd4fa73](https://github.com/americanexpress/jest-image-snapshot/commit/cd4fa734dd72f8e590e8b672c3081468a5842a20)), closes [#300](https://github.com/americanexpress/jest-image-snapshot/issues/300)

# [5.1.0](https://github.com/americanexpress/jest-image-snapshot/compare/v5.0.0...v5.1.0) (2022-05-30)


### Features

* allow storing received screenshot on failure ([#298](https://github.com/americanexpress/jest-image-snapshot/issues/298)) ([cfb81c9](https://github.com/americanexpress/jest-image-snapshot/commit/cfb81c99e1465420f007e180a59559c5d62d1c67))

# [5.0.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.5.1...v5.0.0) (2022-05-30)


### chore

* **jest:** upgrade v28 ([a902a5b](https://github.com/americanexpress/jest-image-snapshot/commit/a902a5baa87d0925b3ff241d7f592f6e1fc0c8fd)), closes [#296](https://github.com/americanexpress/jest-image-snapshot/issues/296)


### BREAKING CHANGES

* **jest:** drop support for Node 10 due
to jest use of globalThis in Node 12

## [4.5.1](https://github.com/americanexpress/jest-image-snapshot/compare/v4.5.0...v4.5.1) (2021-06-25)


### Bug Fixes

* **deps:** bump glob-parent from 5.1.1 to 5.1.2 ([#276](https://github.com/americanexpress/jest-image-snapshot/issues/276)) ([0c5879e](https://github.com/americanexpress/jest-image-snapshot/commit/0c5879ea2552682208e822d5d696c94121ed7125))

# [4.5.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.4.1...v4.5.0) (2021-04-29)


### Features

* allow folders on snapshot identifier ([#267](https://github.com/americanexpress/jest-image-snapshot/issues/267)) ([ad49a97](https://github.com/americanexpress/jest-image-snapshot/commit/ad49a975a425826245a3f72e4df262db09ce25ea))

## [4.4.1](https://github.com/americanexpress/jest-image-snapshot/compare/v4.4.0...v4.4.1) (2021-04-01)


### Bug Fixes

* incorrect stats reported to jest ([#257](https://github.com/americanexpress/jest-image-snapshot/issues/257)) ([e8f949a](https://github.com/americanexpress/jest-image-snapshot/commit/e8f949a845facf4e0fc47f6f63ab59f791d4148a))

# [4.4.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.3.0...v4.4.0) (2021-02-26)


### Features

* better error message ([#254](https://github.com/americanexpress/jest-image-snapshot/issues/254)) ([af44dd4](https://github.com/americanexpress/jest-image-snapshot/commit/af44dd49bf82caefb289b7780c97a1ba6bcc9e8d))

# [4.3.0](https://github.com/americanexpress/jest-image-snapshot/compare/v4.2.0...v4.3.0) (2020-12-16)


### Features

* inline images support ([#244](https://github.com/americanexpress/jest-image-snapshot/issues/244)) ([b82b068](https://github.com/americanexpress/jest-image-snapshot/commit/b82b068c6e001a2e098ac2fbde3abc55ffeb493b))

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
