/* eslint-disable */

/*
 * To enable this image reporter, add it to your `jest.config.js` "reporters" definition:
    "reporters": [ "default", "<rootDir>/image-reporter.js" ]
 */

const chalk = require('chalk');
const fs = require('fs');
const AWS = require('aws-sdk/global');
const S3 = require('aws-sdk/clients/s3');

const UPLOAD_BUCKET = 'YOUR_S3_BUCKET_NAME';

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

class ImageReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onTestResult(test, testResult, aggregateResults) {
    if (testResult.numFailingTests && testResult.failureMessage.match(/different from snapshot/)) {
      const files = fs.readdirSync('./__tests__/__image_snapshots__/__diff_output__/');
      files.forEach((value) => {
        const path = `diff_output/${value}`;
        const params = {
          Body: fs.readFileSync(`./__tests__/__image_snapshots__/__diff_output__/${value}`),
          Bucket: UPLOAD_BUCKET,
          Key: path,
          ContentType: 'image/png',
        };
        s3.putObject(params, (err) => {
          if (err) {
            console.log(err, err.stack);
          } else {
            console.log(chalk.red.bold(`Uploaded image diff file to https://${UPLOAD_BUCKET}.s3.amazonaws.com/${path}`));
          }
        });
      });
    }
  }
}

module.exports = ImageReporter;
