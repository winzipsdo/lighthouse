from pymongo import MongoClient
from chart import ceiling_gap
from json import dumps
from pdb import set_trace

if __name__ == "__main__":
  client = MongoClient('127.0.0.1', 27017)
  collection = client['v']['xes_fed_bi_perf_tasks_finished']
  res = collection.find()

  bucket = {}
  watch_list = [
    {
      'name': 'first-contentful-paint',
      'gap': 100
    },
    {
      'name': 'first-meaningful-paint',
      'gap': 100
    },
    {
      'name': 'speed-index',
      'gap': 100
    },
    {
      'name': 'estimated-input-latency',
      'gap': 5
    },
    {
      'name': 'interactive',
      'gap': 100
    },
    {
      'name': 'first-cpu-idle',
      'gap': 100
    },
  ]

  count = 0
  for i in res:
    count += 1
    if count % 100 == 0:
      print(count)
    mode = i['configSettings']['emulatedFormFactor']
    if mode not in bucket:
      bucket[mode] = {}
    for metric in watch_list:
      metric_name = metric['name']
      metric_value = i['audits'][metric_name]['rawValue']
      metric_gap = 0
      try:
        metric_gap = ceiling_gap(metric_value, metric['gap'])
      except:
        print(i['_id'])
        print(metric)
        print(metric_value)
      if metric_name not in bucket[mode]:
        bucket[mode][metric_name] = {}
      if metric_gap not in bucket[mode][metric_name]:
        bucket[mode][metric_name][metric_gap] = 0
      bucket[mode][metric_name][metric_gap] += 1

  print(dumps(bucket))
