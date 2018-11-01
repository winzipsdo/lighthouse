/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Generates a chromium trace file from user timing measures
 * Adapted from https://github.com/tdresser/performance-observer-tracing
 * @param {LH.Artifacts.MeasureEntry[]} entries user timing entries
 * @param {number=} threadId
 */
function generateTraceEvents(entries, threadId = 0) {
  if (!Array.isArray(entries)) return [];

  /** @type {LH.TraceEvent[]} */
  const currentTrace = [];
  entries.sort((a, b) => a.startTime - b.startTime);
  entries.forEach((entry, i) => {
    /** @type {LH.TraceEvent} */
    const startEvt = {
      // 1) Remove 'lh:' for readability
      // 2) Colons in user_timing names get special handling in traceviewer we don't want. https://goo.gl/m23Vz7
      //    Replace with a 'Modifier letter colon' ;)
      name: entry.name.replace('lh:', '').replace(/:/g, '꞉'),
      cat: 'blink.user_timing',
      ts: entry.startTime * 1000,
      args: {},
      dur: 0,
      pid: 0,
      tid: threadId,
      ph: 'b',
      id: '0x' + (i++).toString(16),
    };

    if (entry.duration === 0) {
      startEvt.ph = 'n';
      startEvt.s = 't';
    }

    const endEvt = JSON.parse(JSON.stringify(startEvt));
    endEvt.ph = 'e';
    endEvt.ts = startEvt.ts + (entry.duration * 1000);

    currentTrace.push(startEvt);
    currentTrace.push(endEvt);
  });

  // Add labels
  /** @type {LH.TraceEvent} */
  const metaEvtBase = {
    pid: 0,
    tid: threadId,
    ts: 0,
    dur: 0,
    ph: 'M',
    cat: '__metadata',
    name: 'process_labels',
    args: {labels: 'Default'},
  };
  currentTrace.push(Object.assign({}, metaEvtBase, {args: {labels: 'Lighthouse Timing'}}));

  return currentTrace;
}

/**
 * Writes a trace file to disk
 * @param {LH.Result} lhr
 * @return {string}
 */
function createTraceString(lhr) {
  const gatherEntries = lhr.timing.entries.filter(entry => entry.gather);
  const entries = lhr.timing.entries.filter(entry => !gatherEntries.includes(entry));

  const auditEvents = generateTraceEvents(entries);
  const gatherEvents = generateTraceEvents(gatherEntries, 10);
  const events = [...auditEvents, ...gatherEvents];

  const jsonStr = `
  { "traceEvents": [
    ${events.map(evt => JSON.stringify(evt)).join(',\n')}
  ]}`;

  return jsonStr;
}

module.exports = {generateTraceEvents, createTraceString};
