# jest-image-snapshot

Jest matcher that performs image comparisons using [Blink-diff](https://github.com/yahoo/blink-diff) and behaves just like [Jest snapshots](https://facebook.github.io/jest/docs/snapshot-testing.html) do! Very useful for browser visual comparison testing.

## Installation:
1. Install:
  ```
  npm i --save-dev jest-image-snapshot
  ```
2. Extend Jest's `expect`:
  ```javascript
    const { toMatchImageSnapshot } = require('jest-image-snapshot');

    expect.extend({ toMatchImageSnapshot });
  ```

## Usage:

  ```javascript
  it('should demonstrate this matcher`s usage', () => {
    ...
    expect(image).toMatchImageSnapshot();
  });
```

  Given an image (should be either a PNGImage instance or a Buffer instance with PNG data) the `toMatchImageSnapshot()` matcher will create a `__image_snapshots__` directory in the directory the test is in and will store the baseline snapshot image there on the first run.

  On subsequent test runs the matcher will compare the image being passed against the stored snapshot.

  To update the stored image snapshot run jest with `--updateSnapshot` or `-u` argument. All this works the same way as [Jest snapshots](https://facebook.github.io/jest/docs/snapshot-testing.html).

  Typically this matcher is used to for visual tests that run on a browser. For example:
  ```javascript
    it('should render correctly in browser', async () => {
      // everything above the expect is pseudo-code, obvi
      const browser = await launchChromeHeadless();
      await browser.goToUrl('https://google.com');
      const screenshot = await browser.takeScreenshot();

      expect(screenshot).toMatchImageSnapshot();
      });
    });
  ```

  ### Optional configuration:

  `toMatchImageSnapshot()` takes an optional [blink-diff configuration parameter](http://yahoo.github.io/blink-diff/#object-usage):

  ```javascript
    it('should demonstrate this matcher`s usage with a custom blink-diff config', () => {
      ...
      const blinkDiffConfig = { perceptual: true };
      expect(image).toMatchImageSnapshot(blinkDiffConfig);
    });  
  ```

  A blink-diff custom configuration can be provided so long as the values for `imageAPath`, `imageA`, `imageBPath`, `imageB`, or `imageOutputPath` are not changed as these are used internally.


  ## Contributing
  We welcome Your interest in the American Express Open Source Community on Github.
  Any Contributor to any Open Source Project managed by the American Express Open
  Source Community must accept and sign an Agreement indicating agreement to the
  terms below. Except for the rights granted in this Agreement to American Express
  and to recipients of software distributed by American Express, You reserve all
  right, title, and interest, if any, in and to Your Contributions. Please [fill
  out the Agreement](http://goo.gl/forms/mIHWH1Dcuy).

  Please open pull requests against `develop` branch and see `CONTRIBUTING.md` for commit formatting details.

  ## License
  Any contributions made under this project will be governed by the [Apache License
  2.0](https://github.com/americanexpress/jest-image-snapshot/blob/master/LICENSE.txt).

  ## Code of Conduct
  This project adheres to the [American Express Community Guidelines](https://github.com/americanexpress/jest-image-snapshot/wiki/Code-of-Conduct).
  By participating, you are expected to honor these guidelines.
