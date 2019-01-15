'use strict';

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const bodyParser = require('body-parser');
const app = express();
const demo = require('./demo');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

router.get('/', (req, res) => {
  res.send('hello world');
});

router.all('/api/metrics', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST,GET,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  const {url} = req.body;
  console.log(`${new Date()} FROM ${req.headers.origin} GET ${req.url} RESPONSED`);
  await demo.launchChromeAndRunLighthouse(url, demo.config.flags, demo.config.desktopConfig)
  .then((result) => {
    res.status(200).send(result);
  })
  .catch(() => {
    res.status(500).send('internal error happened');
  });
});

app.use(router);

const port = 8888;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port} now.`);
});
