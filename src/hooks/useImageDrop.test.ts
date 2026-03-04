import { describe, it, expect } from 'vitest'
import { constrainDimensions } from './useImageDrop'

describe('constrainDimensions', () => {
  // --- Within bounds ---
  it('returns original dimensions when within maxSize', () => {
    expect(constrainDimensions(400, 300)).toEqual({ width: 400, height: 300 })
  })

  it('returns original when exactly at maxSize', () => {
    expect(constrainDimensions(800, 800)).toEqual({ width: 800, height: 800 })
  })

  it('returns original for small images', () => {
    expect(constrainDimensions(1, 1)).toEqual({ width: 1, height: 1 })
  })

  // --- Landscape scaling ---
  it('scales landscape image to fit maxSize', () => {
    const result = constrainDimensions(1600, 800)
    expect(result.width).toBe(800)
    expect(result.height).toBe(400)
  })

  it('scales wide landscape correctly', () => {
    const result = constrainDimensions(2400, 600)
    expect(result.width).toBe(800)
    expect(result.height).toBe(200)
  })

  // --- Portrait scaling ---
  it('scales portrait image to fit maxSize', () => {
    const result = constrainDimensions(600, 1200)
    expect(result.width).toBe(400)
    expect(result.height).toBe(800)
  })

  // --- Square scaling ---
  it('scales square image to fit maxSize', () => {
    const result = constrainDimensions(1600, 1600)
    expect(result.width).toBe(800)
    expect(result.height).toBe(800)
  })

  // --- Aspect ratio ---
  it('preserves aspect ratio when scaling down', () => {
    const result = constrainDimensions(1920, 1080)
    const originalRatio = 1920 / 1080
    const resultRatio = result.width / result.height
    expect(Math.abs(originalRatio - resultRatio)).toBeLessThan(0.02)
  })

  // --- Custom maxSize ---
  it('respects custom maxSize parameter', () => {
    const result = constrainDimensions(400, 300, 200)
    expect(result.width).toBe(200)
    expect(result.height).toBe(150)
  })

  it('does not constrain when within custom maxSize', () => {
    expect(constrainDimensions(100, 50, 200)).toEqual({ width: 100, height: 50 })
  })

  // --- Edge cases ---
  it('handles 0x0 dimensions', () => {
    // 0 <= 800 so returns as-is
    expect(constrainDimensions(0, 0)).toEqual({ width: 0, height: 0 })
  })

  it('handles very large images', () => {
    const result = constrainDimensions(10000, 5000)
    expect(result.width).toBeLessThanOrEqual(800)
    expect(result.height).toBeLessThanOrEqual(800)
  })
})
