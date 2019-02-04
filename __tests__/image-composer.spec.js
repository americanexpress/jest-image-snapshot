/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

/* eslint-disable global-require */
const ImageComposer = require('../src/image-composer');

describe('image-composer', () => {
  const imageOneRaw = {};
  const imageOneWidth = 100;
  const imageOneHeight = 100;

  const imageTwoRaw = {};
  const imageTwoWidth = 100;
  const imageTwoHeight = 100;

  it('it should use default direction horizontal', () => {
    const composer = new ImageComposer();
    const params = composer.getParams();

    expect(params).toHaveProperty('direction', 'horizontal');
  });

  it('it should change direction to vertical', () => {
    const composer = new ImageComposer({ direction: 'vertical' });
    const params = composer.getParams();

    expect(params).toHaveProperty('direction', 'vertical');
  });

  it('it should add one image', () => {
    const composer = new ImageComposer();
    composer.addImage(imageOneRaw, imageOneWidth, imageOneHeight);
    const params = composer.getParams();

    expect(params).toHaveProperty('imagesCount', 1);
  });

  it('it should add two image', () => {
    const composer = new ImageComposer();
    composer.addImage(imageOneRaw, imageOneWidth, imageOneHeight);
    composer.addImage(imageTwoRaw, imageTwoWidth, imageTwoHeight);
    const params = composer.getParams();

    expect(params).toHaveProperty('imagesCount', 2);
  });

  it('it should align images horizontally', () => {
    const composer = new ImageComposer();
    composer.addImage(imageOneRaw, imageOneWidth, imageOneHeight);
    composer.addImage(imageTwoRaw, imageTwoWidth, imageTwoHeight);
    const params = composer.getParams();

    expect(params).toHaveProperty('compositeWidth', 200);
    expect(params).toHaveProperty('compositeHeight', 100);
    expect(params).toHaveProperty('offsetX', 100);
    expect(params).toHaveProperty('offsetY', 0);
  });

  it('it should align images vertically', () => {
    const composer = new ImageComposer({ direction: 'vertical' });
    composer.addImage(imageOneRaw, imageOneWidth, imageOneHeight);
    composer.addImage(imageTwoRaw, imageTwoWidth, imageTwoHeight);
    const params = composer.getParams();

    expect(params).toHaveProperty('compositeWidth', 100);
    expect(params).toHaveProperty('compositeHeight', 200);
    expect(params).toHaveProperty('offsetX', 0);
    expect(params).toHaveProperty('offsetY', 100);
  });
});
