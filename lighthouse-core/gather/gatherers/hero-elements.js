/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Gatherer = require('./gatherer');
const pageFunctions = require('../../lib/page-functions');

/* eslint-env node, browser */

/** @typedef {'h1'|'h2'|'img'|'backgroundImage'} HeroElementName */

/**
 * @typedef HeroElement
 * @prop {HeroElementName} name
 * @prop {number} x
 * @prop {number} y
 * @prop {number} width
 * @prop {number} height
 */

/**
 * This function is heavily based on the implementation of Hero Element Timings in WPT which has an identical Google Apache 2.0 License.
 * It runs in the browser to find the ClientRects of HeroElements.
 * @see https://github.com/WPO-Foundation/wptagent/blob/bee2afd18a2e4184cef63ca7341ce0dd275f9adf/internal/js/hero_elements.js
 * @param {Array<HTMLElement>} allDocumentElements
 * @return {Array<HeroElement>}
 */
/* istanbul ignore next */
function findHeroElements(allDocumentElements) {
  /**
   * @param {HeroElementName} name
   * @param {ClientRect} rect
   * @param {number} area
   */
  function setHeroElement(name, rect, area) {
    heroElements[name] = {
      name: name,
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    elementAreas[name] = area;
  }

  /**
   * @param {HeroElementName} name
   * @param {number} area
   */
  function isLargestHero(name, area) {
    return elementAreas[name] < area;
  }

  /**
   * @param {HTMLElement} el
   */
  function isVisibleElement(el) {
    return el.offsetHeight > 0;
  }

  /**
   * @param {ClientRect} rect
   */
  function isInViewport(rect) {
    return !(
      rect.top + rect.height <= 0 || // Element is above the viewport
      rect.top >= viewportHeight || // Element is below the viewport
      rect.left + rect.width <= 0 || // Element is left of the viewport
      rect.left >= viewportWidth // Element is right of the viewport
    );
  }

  /**
   * @param {HTMLElement} el
   */
  function hasValidBackgroundImage(el) {
    const computedStyle = window.getComputedStyle(el);
    if (!computedStyle.backgroundImage) return false;
    const elementBgImg = computedStyle.backgroundImage.toLowerCase();

    return (
      elementBgImg.indexOf('url(') === 0 &&
      computedStyle.backgroundRepeat !== 'repeat' &&
      computedStyle.backgroundRepeat !== 'repeat-x' &&
      computedStyle.backgroundRepeat !== 'repeat-y'
    );
  }

  /**
   * @param {ClientRect} rect
   */
  function visibleElementArea(rect) {
    let w = rect.width;
    let h = rect.height;

    if (rect.left < 0) {
      w = w + rect.left;
    } else if (viewportWidth < rect.left + rect.width) {
      w = viewportWidth - rect.left;
    }

    if (rect.top < 0) {
      h = h + rect.top;
    } else if (viewportHeight < rect.top + rect.height) {
      h = viewportHeight - rect.top;
    }

    return w * h;
  }

  const document_ = /** @type {HTMLElement} */ (document.documentElement);
  /** @type {Record<HeroElementName, HeroElement>} */
  const heroElements = {};
  /** @type {Record<HeroElementName, number>} */
  const elementAreas = {h1: 0, h2: 0, img: 0, backgroundImage: 0};
  const viewportHeight = document_.clientHeight;
  const viewportWidth = document_.clientWidth;

  for (const element of allDocumentElements) {
    const elementRect = element.getBoundingClientRect();
    const elementArea = visibleElementArea(elementRect);

    if (isVisibleElement(element) && isInViewport(elementRect)) {
      if (element.tagName === 'H1' && isLargestHero('h1', elementArea)) {
        setHeroElement('h1', elementRect, elementArea);
      } else if (element.tagName === 'H2' && isLargestHero('h2', elementArea)) {
        setHeroElement('h2', elementRect, elementArea);
      } else if (element.tagName === 'IMG' && isLargestHero('img', elementArea)) {
        setHeroElement('img', elementRect, elementArea);
      }

      if (
        hasValidBackgroundImage(element) &&
        (!elementAreas.backgroundImage || elementArea > elementAreas.backgroundImage)
      ) {
        setHeroElement('backgroundImage', elementRect, elementArea);
      }
    }
  }

  if (heroElements.h2) {
    if (!heroElements.h1) {
      // If there was an H2 but no H1, we use the H2 as the hero heading element
      heroElements.h1 = heroElements.h2;
      heroElements.h1.name = 'h1';
    }

    delete heroElements.h2;
  }

  return Object.values(heroElements);
}

class HeroElements extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<LH.Artifacts['HeroElements']>}
   */
  afterPass(passContext) {
    const driver = passContext.driver;
    const expression = `(function () {
      ${pageFunctions.getElementsInDocumentString};
      ${findHeroElements.toString()};
      return findHeroElements(getElementsInDocument());
    })()`;

    return driver.evaluateAsync(expression, {useIsolation: true});
  }
}

module.exports = HeroElements;
