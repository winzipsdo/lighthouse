/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const assert = require('assert');

const LastPaintedHero = require('../../../computed/metrics/last-painted-hero.js');
const trace = require('../../fixtures/traces/progressive-app-m60.json');
const devtoolsLog = require('../../fixtures/traces/progressive-app-m60.devtools.log.json');

/* eslint-env jest */

describe('Metrics: Last Painted Hero', () => {
  describe('#findLastChangedTiming', () => {
    const createImageData = pixels => ({width: 2, height: 2, data: pixels});

    const createFrame = ({ts, progress, pixels}) => ({
      isProgressInterpolated: () => false,
      getProgress: () => progress,
      getParsedImage: () => createImageData(pixels),
      getTimeStamp: () => ts,
    });

    let frames, speedline, viewport;

    beforeEach(() => {
      frames = [
        createFrame({ts: 0, progress: 0, pixels: [0, 0, 0, 0]}),
        createFrame({ts: 1000, progress: 20, pixels: [1, 0, 0, 0]}),
        createFrame({ts: 2000, progress: 40, pixels: [1, 1, 0, 0]}),
        createFrame({ts: 3000, progress: 60, pixels: [1, 1, 1, 0]}),
        createFrame({ts: 4000, progress: 80, pixels: [1, 1, 1, 1]}),
        createFrame({ts: 5000, progress: 100, pixels: [1, 1, 1, 1]}),
      ];

      speedline = {
        beginning: 0,
        frames,
      };

      viewport = {innerWidth: 2};
    });

    it('should work when hero finishes early', () => {
      const heroElement = {x: 0, y: 0, width: 1, height: 1};
      const result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(1000);
    });

    it('should work when hero finishes late', () => {
      const heroElement = {x: 1, y: 1, width: 1, height: 1};
      const result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(4000);
    });

    it('should work when hero has larger area', () => {
      const heroElement = {x: 0, y: 0, width: 1, height: 2};
      const result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(3000);
    });

    it('should work when hero has larger area', () => {
      const heroElement = {x: 0, y: 0, width: 1, height: 2};
      const result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(3000);
    });

    it('should baseline timestamps to speedline.beginning', () => {
      speedline.beginning = 500;
      const heroElement = {x: 0, y: 0, width: 1, height: 1};
      const result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(500);
    });

    it('should handle viewports with different size from screenshots', () => {
      viewport.innerWidth = 1000;
      let heroElement = {x: 500, y: 0, width: 500, height: 500};
      let result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(2000);
      heroElement = {x: 500, y: 500, width: 500, height: 500};
      result = LastPaintedHero.findLastChangedTiming(speedline, heroElement, viewport);
      expect(result).toBe(4000);
    });
  });

  it('should compute an observed value', async () => {
    const settings = {throttlingMethod: 'provided'};
    const viewport = {innerWidth: 412};
    const heroElements = [
      {name: 'h1', x: 0, y: 0, width: 412, height: 200},
      {name: 'img', x: 0, y: 200, width: 412, height: 200},
    ];
    const context = {settings, computedCache: new Map()};
    const metricData = {heroElements, viewport, trace, devtoolsLog, settings};
    const result = await LastPaintedHero.request(metricData, context);

    assert.equal(Math.round(result.timing), 788);
    assert.equal(result.timestamp, 225414960356);
  });
});
