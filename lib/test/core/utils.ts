import assert from 'node:assert'
import { describe, it } from 'node:test'

import * as Utils from '../../src/core/utils.js'

import { ValueType } from '../../src/core/constants.js'
import { createSampleValueDict, SampleObject } from './common/helpers.js'

const SAMPLE_VALUES = createSampleValueDict()

describe('Testing Utils', () => {
  it('isBoolean', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('boolean')) assert.strictEqual(Utils.isBoolean(value), true)
        else assert.strictEqual(Utils.isBoolean(value), false)
      }
    }
  })

  it('isNumber', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('number') || key === 'NaN' || key === 'Infinity')
          assert.strictEqual(Utils.isNumber(value), true)
        else assert.strictEqual(Utils.isNumber(value), false)
      }
    }
  })

  it('isString', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('string')) assert.strictEqual(Utils.isString(value), true)
        else assert.strictEqual(Utils.isString(value), false)
      }
    }
  })

  it('isSymbol', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('symbol')) assert.strictEqual(Utils.isSymbol(value), true)
        else assert.strictEqual(Utils.isSymbol(value), false)
      }
    }
  })

  it('isObject', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key === 'object' || key === 'null') assert.strictEqual(Utils.isObject(value), true)
        else assert.strictEqual(Utils.isObject(value), false)
      }
    }
  })

  it('isFunction', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('function')) assert.strictEqual(Utils.isFunction(value), true)
        else assert.strictEqual(Utils.isFunction(value), false)
      }
    }
  })

  it('format', () => {
    let text = 'An error occurred when calling %{0}(%{1}, %{2}).'
    assert.strictEqual(Utils.format(text, ['add', 1, 2]), 'An error occurred when calling add(1, 2).')
    text = 'An error occurred.'
    assert.strictEqual(Utils.format(text, []), 'An error occurred.')
  })

  it('getNumber', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('number') || key === 'Infinity') assert.strictEqual(Utils.getNumber(value), value)
        else if (key.startsWith('stringNumber')) assert.strictEqual(Utils.getNumber(value), parseFloat(value as string))
        else assert.strictEqual(Utils.getNumber(value), undefined)
      }
    }
  })

  it('getBoolean', () => {
    for (const key in SAMPLE_VALUES) {
      if (Object.prototype.hasOwnProperty.call(SAMPLE_VALUES, key)) {
        const value = SAMPLE_VALUES[key]
        if (key.startsWith('boolean')) assert.strictEqual(Utils.getBoolean(value), value)
        else assert.strictEqual(Utils.getBoolean(value), undefined)
      }
    }
  })

  it('getProperties', () => {
    assert.deepStrictEqual(Utils.getProperties(new SampleObject()), {
      _sampleBaseField: ValueType.boolean,
      sampleBaseProp: ValueType.undefined,
      sampleBaseMethod: ValueType.function,
      _sampleField: ValueType.boolean,
      sampleProp: ValueType.undefined,
      sampleMethod: ValueType.function
    })
  })

  it('createObject', () => {
    const properties = Utils.getProperties(SAMPLE_VALUES)
    assert.deepStrictEqual(Utils.getProperties(Utils.createObject(properties)), properties)
  })
})
