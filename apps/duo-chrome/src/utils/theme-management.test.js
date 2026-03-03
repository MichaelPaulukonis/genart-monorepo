import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getThemes,
  saveTheme,
  deleteTheme,
  getThemeById,
  getAssignments,
  saveAssignments,
  assignTheme
} from './theme-management'

describe('Theme Management Utility', () => {
  let localStorageMock

  beforeEach(() => {
    localStorageMock = {}

    vi.stubGlobal('localStorage', {
      getItem: (key) => localStorageMock[key] || null,
      setItem: (key, value) => { localStorageMock[key] = value.toString() },
      clear: () => { localStorageMock = {} }
    })
  })

  describe('Theme Operations', () => {
    it('should return empty array when no themes exist', () => {
      expect(getThemes()).toEqual([])
    })

    it('should save a new theme', () => {
      const theme = saveTheme('Test Theme', { searchString: 'test' })
      expect(theme).toHaveProperty('id')
      expect(theme.name).toBe('Test Theme')
      expect(theme.filter).toEqual({ searchString: 'test' })

      const themes = getThemes()
      expect(themes).toHaveLength(1)
      expect(themes[0]).toEqual(theme)
    })

    it('should get a theme by ID', () => {
      const created = saveTheme('My Theme', { searchString: 'foo' })
      const retrieved = getThemeById(created.id)
      expect(retrieved).toEqual(created)
    })

    it('should return undefined for non-existent theme ID', () => {
      expect(getThemeById('non-existent')).toBeUndefined()
    })

    it('should delete a theme', () => {
      const t1 = saveTheme('Theme 1', { searchString: '1' })
      const t2 = saveTheme('Theme 2', { searchString: '2' })

      expect(getThemes()).toHaveLength(2)

      const remaining = deleteTheme(t1.id)
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(t2.id)
      expect(getThemes()).toHaveLength(1)
    })
  })

  describe('Assignment Operations', () => {
    it('should return default assignments when none exist', () => {
      expect(getAssignments()).toEqual({ 0: null, 1: null })
    })

    it('should assign a theme to a position', () => {
      const assignments = assignTheme(0, 'theme-123')
      expect(assignments[0]).toBe('theme-123')
      expect(assignments[1]).toBeNull()

      const stored = getAssignments()
      expect(stored).toEqual(assignments)
    })

    it('should update existing assignment', () => {
      assignTheme(1, 'theme-A')
      const assignments = assignTheme(1, 'theme-B')
      expect(assignments[1]).toBe('theme-B')
    })

    it('should clear assignment when theme is deleted', () => {
      const theme = saveTheme('To Delete', { searchString: 'delete' })
      assignTheme(0, theme.id)

      expect(getAssignments()[0]).toBe(theme.id)

      deleteTheme(theme.id)
      expect(getAssignments()[0]).toBeNull()
    })
  })
})
