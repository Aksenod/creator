import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('replaces spaces with dashes', () => {
    expect(slugify('my element name')).toBe('my-element-name')
  })
  it('replaces underscores with dashes', () => {
    expect(slugify('my_element')).toBe('my-element')
  })
  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld')
  })
  it('collapses multiple dashes', () => {
    expect(slugify('hello---world')).toBe('hello-world')
  })
  it('trims leading/trailing dashes', () => {
    expect(slugify('-hello-')).toBe('hello')
  })
  it('returns "element" for empty string', () => {
    expect(slugify('')).toBe('element')
  })
  it('returns "element" for all-special-chars', () => {
    expect(slugify('!!!@@@###')).toBe('element')
  })
  it('trims whitespace', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })
  it('handles mixed underscores and spaces', () => {
    expect(slugify('my _element_ name')).toBe('my-element-name')
  })
})
