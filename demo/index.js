'use strict';

const lighthouse = require('../lighthouse-core');
const ChromeLauncher = require('chrome-launcher');

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
    });
  });
}

const opts = {
  chromeFlags: ['--show-paint-rects', '--headless'],
  locale: 'zh',
};

// Usage:
// launchChromeAndRunLighthouse('https://www.baidu.com', opts)
launchChromeAndRunLighthouse('http://127.0.0.1:8080/', opts)
.then((results) => {
  console.log(results);
});
