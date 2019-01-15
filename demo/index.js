'use strict';

const lighthouse = require('../lighthouse-core');
const ChromeLauncher = require('chrome-launcher');
const desktopConfig = require('./config/neal-desktop-config');
const mobileConfig = require('./config/neal-mobile-config'); // eslint-disable-line no-unused-vars

function launchChromeAndRunLighthouse(url, opts, config = null) {
  return ChromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config)
    .then(results => {
      // use results.lhr for the JS-consumeable output
      // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
      // use results.report for the HTML/JSON/CSV output as a string
      // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      return chrome.kill().then(() => results.lhr);
    })
    .catch((err) => {
      console.log(err);
    });
  });
}

const opts = {
  locale: 'zh',
  chromeFlags: ['--show-paint-rects', '--headless'],
  onlyCategories: ['performance'],
};

// Usage:
// launchChromeAndRunLighthouse('http://www.xueersi.com', opts, desktopConfig)
// // launchChromeAndRunLighthouse('http://127.0.0.1:8080/', opts, desktopConfig)
// .then((results) => {
//   console.log(JSON.stringify(results));
// });

// launchChromeAndRunLighthouse('http://127.0.0.1:8080/', opts, mobileConfig)
// .then((results) => {
//   console.log(results);
// });

module.exports = {
  config: {
    flags: opts,
    desktopConfig,
    mobileConfig,
  },
  launchChromeAndRunLighthouse,
};
