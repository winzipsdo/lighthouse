from pymongo import MongoClient
from user_agents import parse as uaparse
from urlparse import urlparse

def get_fullpath(currenthref):
  parsed = urlparse(currenthref)
  return parsed.scheme + '://' + parsed.netloc + parsed.path

def is_mobile(ua):
  return uaparse(ua).is_mobile

if __name__ == '__main__':
  client = MongoClient('127.0.0.1', 27017)
  db = client['v']
  pv_collection = db['xes_fed_bi_pv_log']
  # finished_collection = db['xes_fed_bi_perf_tasks_finished']
  unfinished_collection = db['xes_fed_bi_perf_tasks_unfinished']
  res = pv_collection.find()
  count = 0
  for i in res:
    count += 1
    if count % 1000 == 0:
      print(count)
    condition = {}
    condition['requestedUrl'] = get_fullpath(i['data']['currenthref'])
    if 'ua' in i and is_mobile(i['ua']):
      condition['mode'] = 'mobile'
    elif 'ua' not in i:
      condition['mode'] = 'mobile'
    else:
      condition['mode'] = 'desktop'
    unfinished_collection.update_one(
      condition,
      { '$set': condition },
      upsert=True
    )