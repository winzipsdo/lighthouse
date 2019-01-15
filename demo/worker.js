'use strict';

const MongoClient = require('mongodb').MongoClient;
const audit = require('./index');
const fs = require('fs');

class Worker {
  constructor(config) {
    if (config) {
      this.url = config.url || 'mongodb://localhost:27017';
      this.dbName = config.url || 'v';
      this.unfinishedCollectionName = config.url || 'xes_fed_bi_perf_tasks_unfinished';
      this.finishedCollectionName = config.url || 'xes_fed_bi_perf_tasks_finished';
    } else {
      this.url = 'mongodb://localhost:27017';
      this.dbName = 'v';
      this.unfinishedCollectionName = 'xes_fed_bi_perf_tasks_unfinished';
      this.finishedCollectionName = 'xes_fed_bi_perf_tasks_finished';
    }

    this.addFinishedTask = this.addFinishedTask.bind(this);
    this.isFinished = this.isFinished.bind(this);
    this.run = this.run.bind(this);
  }

  async isFinished(db, requestedUrl, mode) {
    const finishedCollection = db.collection(this.finishedCollectionName);
    finishedCollection.findOne({requestedUrl, mode}, (err, res) => {
      if (err !== null) console.log(err);
      return res;
    });
  }

  async getUnfinishedTask(db) {
    return new Promise((resolve, reject) => {
      const unfinishedCollection = db.collection(this.unfinishedCollectionName);
      unfinishedCollection.findOne({}, (err, res) => {
        if (err !== null) reject(err);
        resolve(res);
      });
    });
  }

  async addFinishedTask(db, data) {
    return new Promise((resolve, reject) => {
      const finishedCollection = db.collection(this.finishedCollectionName);
      finishedCollection.insertOne(data, (err, res) => {
        err && reject(err);
        console.log(`${new Date()} insert ${data.requestedUrl}`);
        resolve(res);
      });
    });
  }

  async deleteUnfinishedTask(db, requestedUrl, mode) {
    return new Promise((resolve, reject) => {
      const unfinishedCollection = db.collection(this.unfinishedCollectionName);
      unfinishedCollection.remove({requestedUrl, mode}, (err, res) => {
        err && reject(err);
        resolve(res);
      });
    });
  }

  async run() {
    const client = new MongoClient(this.url, {useNewUrlParser: true});
    client.connect(async (err) => {
      if (err !== null) console.log(err);
      console.log('connected to mongo');
      const db = client.db(this.dbName);

      while (await this.getUnfinishedTask(db) !== null) {
        const todoTask = await this.getUnfinishedTask(db);
        const config = todoTask.mode === 'desktop'
          ? audit.config.desktopConfig
          : audit.config.mobileConfig;
        const result = await audit
        .launchChromeAndRunLighthouse(todoTask.requestedUrl, audit.config.flags, config);
        delete result.audits['critical-request-chains']; // TODO dot in the key
        delete result.i18n;
        result.mode = todoTask.mode;
        await this.addFinishedTask(db, result);
        await this.deleteUnfinishedTask(db, todoTask.requestedUrl, todoTask.mode);
      }

      client.close();
    });
  }
}

(async function main() {
  const worker = new Worker();
  await worker.run();
})();

module.exports = Worker;
