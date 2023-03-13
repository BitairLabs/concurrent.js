import { expect } from 'chai'
import { ErrorMessage, ValueType } from '../../src/core/constants.js'

describe('Testing constants', () => {
  it('ErrorMessage has no duplicated codes', () => {
    const codes: number[] = []
    for (const key in ErrorMessage) {
      if (Object.prototype.hasOwnProperty.call(ErrorMessage, key)) {
        const code = Reflect.get(ErrorMessage, key).code
        expect(codes).not.include(code)
        codes.push(code)
      }
    }
  })

  it('ValueType has no duplicated codes', () => {
    const codes: number[] = []
    for (const key in ValueType) {
      if (Object.prototype.hasOwnProperty.call(ValueType, key)) {
        const code = Reflect.get(ValueType, key)
        expect(codes).not.include(code)
        codes.push(code)
      }
    }
  })
})
