'use strict';

const MongoClient = require('mongodb').MongoClient;
const asset = require('assert');

const url = 'mongodb://localhost:27017';
const dbName = 'v';
const unfinishedCollectionName = 'xes_fed_bi_perf_tasks_unfinished';
const finishedCollectionName = 'xes_fed_bi_perf_tasks_finished';

async function newTask() {
  const client = new MongoClient(url, {useNewUrlParser: true});
  client.connect(function(err) {
    asset.equal(null, err);
    console.log('connected to mongo');
    const db = client.db(dbName);
    const finishedCollection = db.collection(finishedCollectionName);
    finishedCollection.insertOne({'hello': 'workd'}, (res) => {
      if (res !== null) console.log(res);
      else console.log('insert successful');
    });
    // pass
    client.close();
  });
}

async function finishTask() {
  const client = new MongoClient(url, {useNewUrlParser: true});
  client.connect(function(err) {
    asset.equal(null, err);
    console.log('connected to mongo');
    const db = client.db(dbName);
    const unfinishedCollection = db.collection(unfinishedCollectionName);
    const finishedCollection = db.collection(finishedCollectionName);
    unfinishedCollection.insertOne({'hello': 'workd'}, (res) => {
      if (res !== null) console.log(res);
      else console.log('insert successful');
    });
    finishedCollection.insertOne({'hello': 'workd'}, (res) => {
      if (res !== null) console.log(res);
      else console.log('insert successful');
    });
    // pass
    client.close();
  });
}

(async () => {
  await newTask();
})();

module.exports = {
  newTask,
  finishTask,
};
