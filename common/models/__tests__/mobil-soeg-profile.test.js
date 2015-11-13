'use strict';

/**
 * @file
 * Testing the mobil-soeg-profile model
 *
 * @see ../mobil-soeg-profile.js
 */

// Libraries
import {assert} from 'chai';
import sinon from 'sinon';

// Models
import MobilSoegProfile from '../mobil-soeg-profile';

describe('Testing the mobil-soeg-profile model', () => {

  let sandbox;
  let model;
  const DummyModel = {
    observe: () => {
    },
    remoteMethod: () => {
    },
    validatesUniquenessOf: () => {
    }
  };

  beforeEach(() => {
    model = MobilSoegProfile(DummyModel);
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    model = null;
    sandbox.restore();
  });

  it('Method hashLoanerid should not be invoked', () => {
    const spy = sandbox.spy(model, 'hashLoanerid');

    // Empty context object
    const context = {};
    model.newInstanceCheck(context);

    assert.isFalse(spy.called);
  });

  it('Method hashLoanerid should not be invoked', () => {
    const spy = sandbox.spy(model, 'hashLoanerid');

    // Context object with an instance but without isNewInstance
    const context = {instance: {}};
    model.newInstanceCheck(context);

    assert.isFalse(spy.called);
  });

  it('Method hashLoanerid should be invoked', () => {
    const spy = sandbox.spy(model, 'hashLoanerid');

    // Context object as a new instance would look like
    const context = {instance: {loanerid: 'loanerid'}, isNewInstance: true};
    model.newInstanceCheck(context);

    assert.isTrue(spy.called);
  });

  it('Should throw when loanerid is empty', () => {

    // Empty string
    const context = {instance: {loanerid: ''}, isNewInstance: true};
    assert.throw(() => {
      model.newInstanceCheck(context);
    }, Error, 'Invalid loanerid');
  });

  it('Should throw when loanerid not a string', () => {

    // Empty string
    const context = {instance: {loanerid: []}, isNewInstance: true};
    assert.throws(() => {
      model.newInstanceCheck(context);
    }, Error, 'Invalid loanerid');
  });
});
