<h1 align="center">
  <img src='https://github.com/americanexpress/jest-image-snapshot/raw/main/images/jest-image-snapshot.png' alt="Jest Image Snapshot - One Amex" width='50%'/>
</h1>

[![npm](https://img.shields.io/npm/v/jest-image-snapshot)](https://www.npmjs.com/package/jest-image-snapshot)
![Health Check](https://github.com/americanexpress/jest-image-snapshot/workflows/Health%20Check/badge.svg)
[![Mentioned in Awesome Jest](https://awesome.re/mentioned-badge.svg)](https://github.com/jest-community/awesome-jest)

> Jest matcher that performs image comparisons using [pixelmatch](https://github.com/mapbox/pixelmatch) and behaves just like [Jest snapshots](https://facebook.github.io/jest/docs/snapshot-testing.html) do! Very useful for visual regression testing.

## 👩‍💻 Hiring 👨‍💻

Want to get paid for your contributions to `jest-image-snapshot`?
> Send your resume to oneamex.careers@aexp.com

## 📖 Table of Contents

* [Features](#-features)
* [Usage](#-usage)
* [API](#-api)
* [Contributing](#-contributing)

## ✨ Features

* Take image snapshots of your application
* Ability to compare snapshots from a baseline
* Update snapshots when you're good with changes
* Customize a difference threshold
* Add a Gaussian blur for noise
* Adjust the diff layout horizontal vs vertical

### How it works

Given an image (Buffer instance with PNG image data) the `toMatchImageSnapshot()` matcher will create a `__image_snapshots__` directory in the directory the test is in and will store the baseline snapshot image there on the first run. Note that if `customSnapshotsDir` option is given then it will store baseline snapshot there instead.

On subsequent test runs the matcher will compare the image being passed against the stored snapshot.

To update the stored image snapshot run Jest with `--updateSnapshot` or `-u` argument. All this works the same way as [Jest snapshots](https://facebook.github.io/jest/docs/snapshot-testing.html).

### See it in action

Typically this matcher is used for visual tests that run on a browser. For example let's say I finish working on a feature and want to write a test to prevent visual regressions:

```javascript
...
it('renders correctly', async () => {
  const page = await browser.newPage();
  await page.goto('https://localhost:3000');
  const image = await page.screenshot();

  expect(image).toMatchImageSnapshot();
});
...
```

<img title="Adding an image snapshot" src="https://raw.githubusercontent.com/americanexpress/jest-image-snapshot/main/images/create-snapshot.gif" width="50%">

Then after a few days as I finish adding another feature to my component I notice one of my tests failing!

<img title="A failing image snapshot test" src="https://raw.githubusercontent.com/americanexpress/jest-image-snapshot/main/images/fail-snapshot.gif" width="50%">

Oh no! I must have introduced a regression! Let's see what the diff looks like to identify what I need to fix:

<img title="Image diff" src="https://raw.githubusercontent.com/americanexpress/jest-image-snapshot/main/images/image-diff.png" width="50%">

And now that I know that I broke the card art I can fix it!

Thanks `jest-image-snapshot`, that broken header would not have looked good in production!

## 🤹‍ Usage

### Installation

```bash
npm i --save-dev jest-image-snapshot
```

Please note that `Jest` `>=20 <=29` is a peerDependency. `jest-image-snapshot` will **not** work with anything below Jest 20.x.x

### Invocation

1. Extend Jest's `expect`
```javascript
  const { toMatchImageSnapshot } = require('jest-image-snapshot');

  expect.extend({ toMatchImageSnapshot });
```

2. Use `toMatchImageSnapshot()` in your tests!
```javascript
  it('should demonstrate this matcher`s usage', () => {
    ...
    expect(image).toMatchImageSnapshot();
  });
```

See [the examples](./examples/README.md) for more detailed usage or read about an example use case in the [American Express Technology Blog](https://americanexpress.io/smile-for-the-camera/)

## 🎛️ API

`toMatchImageSnapshot()` takes an optional options object with the following properties:

* `customDiffConfig`: Custom config passed to [pixelmatch](https://github.com/mapbox/pixelmatch#pixelmatchimg1-img2-output-width-height-options) (See options section) or [ssim.js](https://github.com/obartra/ssim/wiki/Usage#options)
  * Pixelmatch specific options
    * By default we have set the `threshold` to 0.01, you can increase that value by passing a customDiffConfig as demonstrated below.
    * Please note the `threshold` set in the `customDiffConfig` is the per pixel sensitivity threshold. For example with a source pixel colour of `#ffffff` (white) and a comparison pixel colour of `#fcfcfc` (really light grey) if you set the threshold to 0 then it would trigger a failure *on that pixel*. However if you were to use say 0.5 then it wouldn't, the colour difference would need to be much more extreme to trigger a failure on that pixel, say `#000000` (black)
  * SSIM specific options
    * By default we set `ssim` to 'bezkrovny'.  It is the fastest option and best option most of the time.  In cases where, higher precision is needed,  this can be set to 'fast'.  See [SSIM Performance Consideration](#ssim-performance-considerations) for a better understanding of how to use this feature.
* `comparisonMethod`: (default: `pixelmatch`) (options `pixelmatch` or `ssim`) The method by which images are compared.  `pixelmatch` does a pixel by pixel comparison, whereas `ssim` does a structural similarity comparison.  `ssim` is a new experimental feature for jest-image-snapshot, but may become the default comparison method in the future.  For a better understanding of how to use SSIM, see [Recommendations when using SSIM Comparison](#recommendations-when-using-ssim-comparison).
* `customSnapshotsDir`: A custom absolute path of a directory to keep this snapshot in
* `customDiffDir`: A custom absolute path of a directory to keep this diff in
* `storeReceivedOnFailure`: (default: `false`) Store the received images seperately from the composed diff images on failure. This can be useful when updating baseline images from CI.
* `customReceivedDir`: A custom absolute path of a directory to keep this received image in
* `customReceivedPostfix`: A custom postfix which is added to the snapshot name of the received image, defaults to `-received`
* `customSnapshotIdentifier`: A custom name to give this snapshot. If not provided one is computed automatically. When a function is provided it is called with an object containing `testPath`, `currentTestName`, `counter` and `defaultIdentifier` as its first argument. The function must return an identifier to use for the snapshot. If a path is given, the path will be created inside the snapshot/diff directories.
* `diffDirection`: (default: `horizontal`) (options `horizontal` or `vertical`) Changes diff image layout direction
* `onlyDiff`: (default: `false`) Either only include the difference between the baseline and the received image in the diff image, or include the 3 images (following the direction set by `diffDirection`).
* `noColors`: Removes coloring from console output, useful if storing the results in a file
* `failureThreshold`: (default `0`) Sets the threshold that would trigger a test failure based on the `failureThresholdType` selected. This is different to the `customDiffConfig.threshold` above, that is the per pixel failure threshold, this is the failure threshold for the entire comparison.
* `failureThresholdType`: (default `pixel`) (options `percent` or `pixel`) Sets the type of threshold that would trigger a failure.
* `updatePassedSnapshot`: (default `false`) Updates a snapshot even if it passed the threshold against the existing one.
* `blur`: (default `0`) Applies Gaussian Blur on compared images, accepts radius in pixels as value. Useful when you have noise after scaling images per different resolutions on your target website, usually setting its value to 1-2 should be enough to solve that problem.
* `runInProcess`: (default `false`) Runs the diff in process without spawning a child process.
* `dumpDiffToConsole`: (default `false`) Will output base64 string of a diff image to console in case of failed tests (in addition to creating a diff image). This string can be copy-pasted to a browser address string to preview the diff for a failed test.
* `dumpInlineDiffToConsole`: (default `false`) Will output the image to the terminal using iTerm's [Inline Images Protocol](https://iterm2.com/documentation-images.html). If the term is not compatible, it does the same thing as `dumpDiffToConsole`.
* `allowSizeMismatch`: (default `false`) If set to true, the build will not fail when the screenshots to compare have different sizes.
* `maxChildProcessBufferSizeInBytes`: (default `10 * 1024 * 1024`) Sets the max number of bytes for stdout/stderr when running `diff-snapshot` in a child process.
* `runtimeHooksPath`: (default `undefined`) This needs to be set to a existing file, like `require.resolve('./runtimeHooksPath.cjs')`. This file can expose a few hooks:
  * `onBeforeWriteToDisc`: before saving any image to the disc, this function will be called (can be used to write EXIF data to images for instance)
    `onBeforeWriteToDisc: (arguments: { buffer: Buffer; destination: string; testPath: string; currentTestName: string }) => Buffer`

```javascript
it('should demonstrate this matcher`s usage with a custom pixelmatch config', () => {
  ...
  const customConfig = { threshold: 0.5 };
  expect(image).toMatchImageSnapshot({
    customDiffConfig: customConfig,
    customSnapshotIdentifier: 'customSnapshotName',
    noColors: true
  });
});
```

The failure threshold can be set in percent, in this case if the difference is over 1%.

```javascript
it('should fail if there is more than a 1% difference', () => {
  ...
  expect(image).toMatchImageSnapshot({
    failureThreshold: 0.01,
    failureThresholdType: 'percent'
  });
});
```

Custom defaults can be set with a configurable extension. This will allow for customization of this module's defaults. For example, a 0% default threshold can be shared across all tests with the configuration below:

```javascript
const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

const customConfig = { threshold: 0 };
const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customDiffConfig: customConfig,
  noColors: true,
});
expect.extend({ toMatchImageSnapshot });
```

### jest.retryTimes()
Jest supports [automatic retries on test failures](https://jestjs.io/docs/en/jest-object#jestretrytimes). This can be useful for browser screenshot tests which tend to have more frequent false positives. Note that when using jest.retryTimes you'll have to use a unique customSnapshotIdentifier as that's the only way to reliably identify snapshots.

### Removing Outdated Snapshots

Unlike jest-managed snapshots, the images created by `jest-image-snapshot` will not be automatically removed by the `-u` flag if they are no longer needed. You can force `jest-image-snapshot` to remove the files by including the `outdated-snapshot-reporter` in your config and running with the environment variable `JEST_IMAGE_SNAPSHOT_TRACK_OBSOLETE`.

```json
{
  "jest": {
    "reporters": [
      "default",
      "jest-image-snapshot/src/outdated-snapshot-reporter.js"
    ]
  }
}
```

**WARNING: Do not run a *partial* test suite with this flag as it may consider snapshots of tests that weren't run to be obsolete.**

```bash
export JEST_IMAGE_SNAPSHOT_TRACK_OBSOLETE=1
jest
```

### Recommendations when using SSIM comparison
Since SSIM calculates differences in structural similarity by building a moving 'window' over an images pixels, it does not particularly benefit from pixel count comparisons, especially when you factor in that it has a lot of floating point arithmetic in javascript.  However, SSIM gains two key benefits over pixel by pixel comparison:
- Reduced false positives (failing tests when the images look the same)
- Higher sensitivity to actual changes in the image itself.

Documentation supporting these claims can be found in the many analyses comparing SSIM to Peak Signal to Noise Ratio (PSNR).  See [Wang, Z.; Simoncelli, E. P. (September 2008). "Maximum differentiation (MAD) competition: a methodology for comparing computational models of perceptual quantities"](https://ece.uwaterloo.ca/~z70wang/publications/MAD.pdf) and  Zhang, L.; Zhang, L.; Mou, X.; Zhang, D. (September 2012). A comprehensive evaluation of full reference image quality assessment algorithms. 2012 19th IEEE International Conference on Image Processing. pp. 1477–1480.  [Wikipedia](https://en.wikipedia.org/wiki/Structural_similarity) also provides many great reference sources describing the topic.

As such, most users can benefit from setting a 1% or 0.01 threshold for any SSIM comparison. The below code shows a one line modification of the 1% threshold example.

```javascript
it('should fail if there is more than a 1% difference (ssim)', () => {
  ...
  expect(image).toMatchImageSnapshot({
    comparisonMethod: 'ssim',
    failureThreshold: 0.01,
    failureThresholdType: 'percent'
  });
});
```
### SSIM Performance Considerations
The default SSIM comparison method used in the jest-image-snapshot implementation is 'bezkrovny' (as a `customDiffConfig` `{ssim: 'bezkrovny'}`).
Bezkrovny is a special implementation of SSIM that is optimized for speed at a small, almost inconsequential change in accuracy.  It gains this benefit by downsampling (or shrinking the original image) before performing the comparisons.
This will provide the best combination of results and performance most of the time.  When the need arises where higher accuracy is desired at the expense of time or a higher quality diff image is needed for debugging,
this option can be changed to `{ssim: 'fast'}`. This uses the original SSIM algorithm described in Wang, et al. 2004 on "Image Quality Assessment: From Error Visibility to Structural Similarity" (https://github.com/obartra/ssim/blob/master/assets/ssim.pdf) optimized for javascript.

The following is an example configuration for using `{ssim: 'fast'}` with toMatchImageSnapshot().
```javascript.
{
  comparisonMethod: 'ssim',
  customDiffConfig: {
    ssim: 'fast',
  },
  failureThreshold: 0.01,
  failureThresholdType: 'percent'
}
```


### Recipes

#### Upload diff images from failed tests

[Example Image Upload Test Reporter](examples/image-reporter.js)

If you are using jest-image-snapshot in an ephemeral environment (like a Continuous Integration server) where the file system does not persist, you might want a way to retrieve those images for diagnostics or historical reference. This example shows how to use a custom [Jest Reporter](https://facebook.github.io/jest/docs/en/configuration.html#reporters-array-modulename-modulename-options) that will run after every test, and if there were any images created because they failed the diff test, upload those images to an [AWS S3](https://aws.amazon.com/s3/) bucket.

To enable this image reporter, add it to your `jest.config.js` "reporters" definition:

```javascript
"reporters": [ "default", "<rootDir>/image-reporter.js" ]
```

#### Usage in TypeScript

In TypeScript, you can use the [DefinitelyTyped](https://www.npmjs.com/package/@types/jest-image-snapshot) definition or declare `toMatchImageSnapshot` like the example below:

_Note: This package is not maintained by the `jest-image-snapshot` maintainers so it may be out of date or inaccurate. Because of this, we do not officially support it._


```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchImageSnapshot(): R
    }
  }
}
```

#### Ignoring parts of the image snapshot if using [Puppeteer](https://github.com/GoogleChrome/puppeteer)

If you want to ignore parts of the snapshot (for example some banners or other dynamic blocks) you can find DOM elements with Puppeteer and remove/modify them (setting visibility: hidden on block, if removing it breaks your layout, should help):

```javascript
async function removeBanners(page){
  await page.evaluate(() => {
    (document.querySelectorAll('.banner') || []).forEach(el => el.remove());
  });
}

...
it('renders correctly', async () => {
  const page = await browser.newPage();
  await page.goto('https://localhost:3000');

  await removeBanners(page);

  const image = await page.screenshot();

  expect(image).toMatchImageSnapshot();
});
...
```

## 🏆 Contributing

We welcome Your interest in the American Express Open Source Community on Github.
Any Contributor to any Open Source Project managed by the American Express Open
Source Community must accept and sign an Agreement indicating agreement to the
terms below. Except for the rights granted in this Agreement to American Express
and to recipients of software distributed by American Express, You reserve all
right, title, and interest, if any, in and to Your Contributions. Please [fill
out the Agreement](https://cla-assistant.io/americanexpress/jest-image-snapshot).

Please feel free to open pull requests and see [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to get started contributing.

## 🗝️ License

Any contributions made under this project will be governed by the [Apache License
2.0](https://github.com/americanexpress/jest-image-snapshot/blob/main/LICENSE.txt).

## 🗣️ Code of Conduct

This project adheres to the [American Express Community Guidelines](https://github.com/americanexpress/jest-image-snapshot/wiki/Code-of-Conduct).
By participating, you are expected to honor these guidelines.
