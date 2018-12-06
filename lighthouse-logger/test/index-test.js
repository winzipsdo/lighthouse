/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */
/* eslint-disable no-invalid-this */

const assert = require('assert');
const log = require('..');

afterEach(log.takeTimeEntries);

describe('Log.timeDecorate', function() {
  it('records timings', () => {
    const fn = () => {};
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'msg',
      id: 'id',
    });
    decoratedFn();
    assert.equal(log.getTimeEntries().length, 1);
    assert.ok(log.getTimeEntries()[0].duration > 0);
  });

  it('retains return value', () => {
    const fn = () => 'works';
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'msg',
      id: 'id',
    });
    assert.equal(decoratedFn(), 'works');
  });

  it('retains async return value', async () => {
    const fn = async () => 'works';
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'msg',
      id: 'id',
    });
    assert.equal(await decoratedFn(), 'works');
  });

  it('retains parameters', () => {
    const fn = (value1, value2) => value1 + value2;
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'msg',
      id: 'id',
    });
    assert.equal(decoratedFn(1, 2), 3);
  });

  it('retains this binding', () => {
    const object = new function() {
      this.value = 'works';
      this.getValue = () => {
        return this.value;
      };
    };
    const fn = object.getValue;
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'msg',
      id: 'id',
    });
    assert.equal(decoratedFn(), 'works');
  });

  it('accepts function template for msg and id', () => {
    // eslint-disable-next-line no-unused-vars
    const fn = (value1, value2) => {};
    const decoratedFn = log.timeDecorate(fn, {
      msg: (value1, value2) => `msg ${value1} ${value2}`,
      id: (value1, value2) => `id:${value1}:${value2}`,
    });
    decoratedFn('it', 'works');
    assert.equal(log.takeTimeEntries()[0].name, 'id:it:works');
  });

  it('scrubs decorator from trace', () => {
    const fn = () => {
      throw new Error('test error');
    };
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'test',
    });
    let sawError = false;
    try {
      decoratedFn();
    } catch (err) {
      assert.ok(!err.stack.includes('timeDecoratedFn'));
      sawError = true;
    }
    assert.ok(sawError);
  });

  it('scrubs decorator from trace, async', async () => {
    const fn = async () => {
      throw new Error('test error');
    };
    const decoratedFn = log.timeDecorate(fn, {
      msg: 'test',
    });
    let sawError = false;
    await decoratedFn().catch(err => {
      assert.ok(!err.stack.includes('timeDecoratedFn'));
      sawError = true;
    });
    assert.ok(sawError);
  });
});

describe('Log.timeDecorateClass', function() {
  it('kitchen sink', () => {
    class Class {
      static get staticWorks() {
        return 'works';
      }

      static getStaticValue(value) {
        return `${value} ${this.staticWorks}`;
      }

      constructor() {
        this.works = 'works';
      }

      getValue(value) {
        return `${value} ${this.works}`;
      }
    }

    log.timeDecorateClass(Class, {
      getStaticValue: {
        msg: value => `msg ${value}`,
        id: value => `id:${value}`,
      },
    });
    assert.equal(Class.getStaticValue('it'), 'it works');
    assert.equal(log.takeTimeEntries()[0].name, 'id:it');

    log.timeDecorateClass(Class.prototype, {
      getValue: {
        msg: value => `msg ${value}`,
        id: value => `id:${value}`,
      },
    });
    assert.equal((new Class).getValue('it'), 'it works');
    assert.equal(log.takeTimeEntries()[0].name, 'id:it');
  });
});
