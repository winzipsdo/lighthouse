/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const makeComputedArtifact = require('../new-computed-artifact.js');
const ComputedMetric = require('./metric');
const Speedline = require('../speedline');

/** @typedef {LH.Artifacts.MetricComputationData & {heroElements: LH.Artifacts['HeroElements']}} LastHeroData */

class LastPaintedHero extends ComputedMetric {
  /**
   * @param {LastHeroData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static computeSimulatedMetric(data, context) {
    throw new Error('Last Painted Hero not yet supported in Lantern');
  }

  /**
   *
   * @param {LH.Artifacts.Speedline} speedline
   * @param {LH.Artifacts['HeroElements'][0]} heroElement
   */
  static findLastChangedTiming(speedline, heroElement) {
    const analyzedFrames = speedline.frames.filter(frame => !frame.isProgressInterpolated());
    let lastChangedTs = speedline.beginning;
    console.log(analyzedFrames.length, 'frames to look at')
    for (let i = 1; i < analyzedFrames.length; i++) {
      const previousFrame = analyzedFrames[i - 1];
      const frame = analyzedFrames[i];
      // If nothing changed between the frames, don't bother comparing
      if (frame.getProgress() === previousFrame.getProgress()) continue;

      // If the frames did change we have to inspect the area of the hero element to see if *that* changed
      const previousImageData = previousFrame.getParsedImage();
      const imageData = frame.getParsedImage();
      const xMax = Math.min(imageData.width, heroElement.x + heroElement.width);
      const yMax = Math.min(imageData.height, heroElement.y + heroElement.height);
      const channels = imageData.data.length / (imageData.width * imageData.height);

      // Traverse the pixels in the area covered by the hero element
      for (let x = heroElement.x; x < xMax; x++) {
        for (let y = heroElement.y; y < yMax; y++) {
          const baseIndex = imageData.width * y + x;
          for (let c = 0; c < channels; c++) {
            const indexToCompare = baseIndex + c;
            const previousValue = previousImageData.data[indexToCompare];
            const value = imageData.data[indexToCompare];
            // If we find a different value, update the timestamp and short-circuit the loops
            if (value !== previousValue) {
              console.log({x, y, indexToCompare, value, previousValue})
              lastChangedTs = frame.getTimeStamp();
              // No one knows how to read loop labels in JavaScript
              // so we'll just mess with the indexes as a more obvious multi-loop break mechanism :)
              x = y = c = Infinity;
            }
          }
        }
      }
    }

    return lastChangedTs - speedline.beginning;
  }

  /**
   * @param {LastHeroData} data
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Artifacts.Metric>}
   */
  static async computeObservedMetric(data, context) {
    const {heroElements, traceOfTab} = data;
    const speedline = await Speedline.request(data.trace, context);

    const lastChangedTimings = heroElements.map(element => {
      return LastPaintedHero.findLastChangedTiming(speedline, element);
    });
    console.log(lastChangedTimings)
    const timing = Math.max(...lastChangedTimings);

    return {
      timing,
      timestamp: traceOfTab.timestamps.navigationStart + timing * 1000,
    };
  }
}

module.exports = makeComputedArtifact(LastPaintedHero);
