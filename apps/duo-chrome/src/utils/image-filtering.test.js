import { describe, it, expect } from 'vitest'
import { filterImages, isValidFilter } from './image-filtering'

describe('Image Filtering Utility', () => {
  const mockImages = [
    'abstract.00.png',
    'blobs.01.png',
    'cat.jpg',
    'dog.PNG',
    'FLOWER.WEBP'
  ]

  describe('filterImages', () => {
    it('should return all images when filter is null or empty', () => {
      expect(filterImages(mockImages, null)).toEqual(mockImages)
      expect(filterImages(mockImages, {})).toEqual(mockImages)
      expect(filterImages(mockImages, { searchString: '' })).toEqual(mockImages)
      expect(filterImages(mockImages, { searchString: '   ' })).toEqual(mockImages)
    })

    it('should perform case-insensitive filtering', () => {
      expect(filterImages(mockImages, { searchString: 'abs' })).toEqual(['abstract.00.png'])
      expect(filterImages(mockImages, { searchString: 'ABS' })).toEqual(['abstract.00.png'])
      expect(filterImages(mockImages, { searchString: 'png' })).toEqual([
        'abstract.00.png',
        'blobs.01.png',
        'dog.PNG'
      ])
    })

    it('should return empty array when no matches found', () => {
      expect(filterImages(mockImages, { searchString: 'xyz' })).toEqual([])
    })

    it('should handle partial matches correctly', () => {
      expect(filterImages(mockImages, { searchString: 'o' })).toEqual([
        'blobs.01.png',
        'dog.PNG',
        'FLOWER.WEBP'
      ])
    })
  })

  describe('isValidFilter', () => {
    it('should return true if filter has matches', () => {
      expect(isValidFilter(mockImages, { searchString: 'cat' })).toBe(true)
    })

    it('should return false if filter has no matches', () => {
      expect(isValidFilter(mockImages, { searchString: 'nonexistent' })).toBe(false)
    })

    it('should return true for empty filter (since it matches all)', () => {
      expect(isValidFilter(mockImages, { searchString: '' })).toBe(true)
    })
  })
})
