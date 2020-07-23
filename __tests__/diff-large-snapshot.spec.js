const puppeteer = require('puppeteer')
const { toMatchImageSnapshot } = require('../src/index')

let browser
let page

  beforeAll(async () => {
    // start Puppeteer with a custom configuration, see above the setup
    browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    expect.extend({ toMatchImageSnapshot })
    // load page
    page = await browser.newPage()
    await page.goto(`https://www.theverge.com/`, {waitUntil: 'load'});
    // scroll to bottom and back up
    await page.waitFor(1000)
    await page.evaluate(() => {
      window.scrollTo(0, Number.MAX_SAFE_INTEGER)
    })
    await page.waitFor(500)
    await page.evaluate(() => {
      window.scrollBy(0, 0)
    })
    await page.waitFor(500)
  })

  test(`Testing viewport: 1400`, async () => {
    // set viewport
    await page.setViewport({
      width: 1400,
      height: 900,
      deviceScaleFactor: 1
    })
    // take full screen screenshot
    let image = await page.screenshot({
      path: `${__dirname}/__image_snapshots__/verge-1440.png`,
      type: 'png',
      fullPage: true
    })
    // compare screenshot
    expect(image).toMatchImageSnapshot({
      customDiffConfig: {
        threshold: 0.01
      },
      customDiffDir: `${__dirname}/__image_snapshots__/`,
      customSnapshotsDir: `${__dirname}/__custom_snapshots_dir__/`,
      customSnapshotIdentifier: `verge-1440`,
      noColors: true
    })
  }, 15000)

  afterAll(async () => {
    await browser.close()
  })
