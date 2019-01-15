from pymongo import MongoClient
from user_agents import parse


def ceiling_gap(num, gap=400):
  quotient = int(num / gap)
  surplus = num % gap
  result = quotient * gap
  if surplus != 0:
    result += gap
  return result


def split_dict(data):
  keys = sorted(data)
  print(keys)
  arr = []
  for i in keys:
    arr.append(data[i])
  print(arr)


def get_fmp():
  client = MongoClient('127.0.0.1', 27017)
  collection = client['v']['xes_fed_bi_perf_afterOL']
  res_mobile = {}
  res_desktop = {}
  res = collection.find()
  count = 0
  for i in res:
    bucket = ceiling_gap(i['fmp'])
    count += 1
    if count % 1000 == 0:
      print(count)
    if parse(i['ua']).is_mobile:
      if bucket not in res_mobile:
        res_mobile[bucket] = 0
      res_mobile[bucket] += 1
    else:
      if bucket not in res_desktop:
        res_desktop[bucket] = 0
      res_desktop[bucket] += 1

  split_dict(res_mobile)
  print('---- gap ----')
  split_dict(res_desktop)


def get_timing():
  client = MongoClient('127.0.0.1', 27017)
  collection = client['v']['xes_fed_bi_perf_OL']

  tti_mobile = {}
  tti_desktop = {}

  fcp_mobile = {}
  fcp_desktop = {}

  res = collection.find()
  count = 0
  for i in res:
    count += 1
    if count % 1000 == 0:
      print(count)
    if 'tti' in i:
      bucket_tti = ceiling_gap(i['tti'])
      if parse(i['ua']).is_mobile:
        if bucket_tti not in tti_mobile:
          tti_mobile[bucket_tti] = 0
        tti_mobile[bucket_tti] += 1
      else:
        if bucket_tti not in tti_desktop:
          tti_desktop[bucket_tti] = 0
        tti_desktop[bucket_tti] += 1

    if 'fcp' in i:
      bucket_fcp = ceiling_gap(i['fcp'])
      if parse(i['ua']).is_mobile:
        if bucket_fcp not in fcp_mobile:
          fcp_mobile[bucket_fcp] = 0
        fcp_mobile[bucket_fcp] += 1
      else:
        if bucket_fcp not in fcp_desktop:
          fcp_desktop[bucket_fcp] = 0
        fcp_desktop[bucket_fcp] += 1

  split_dict(tti_mobile)
  print('---- gap ----')
  print('---- gap ----')
  print('---- gap ----')
  split_dict(tti_desktop)
  print('---- gap ----')
  print('---- gap ----')
  print('---- gap ----')
  split_dict(fcp_mobile)
  print('---- gap ----')
  print('---- gap ----')
  print('---- gap ----')
  split_dict(fcp_desktop)


if __name__ == "__main__":
  get_timing()