import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parseWords, createBundledSource, createUserTextSource, createTumblrSource, BUNDLED_TEXTS } from './text-sources.js'

describe('parseWords', () => {
  it('splits text on whitespace', () => {
    expect(parseWords('foo bar baz')).toEqual(['FOO', 'BAR', 'BAZ'])
  })

  it('splits on punctuation delimiters', () => {
    expect(parseWords('foo, bar; baz.')).toEqual(['FOO', 'BAR', 'BAZ'])
  })

  it('uppercases all words', () => {
    expect(parseWords('hello world')).toEqual(['HELLO', 'WORLD'])
  })

  it('filters empty tokens from extra whitespace', () => {
    expect(parseWords('  foo   bar  ')).toEqual(['FOO', 'BAR'])
  })

  it('splits on newlines', () => {
    expect(parseWords('foo\nbar')).toEqual(['FOO', 'BAR'])
  })
})

describe('createBundledSource', () => {
  it('has correct id and name', () => {
    const src = createBundledSource({ id: 'test', name: 'Test Text', text: 'hello world' })
    expect(src.id).toBe('test')
    expect(src.name).toBe('Test Text')
  })

  it('fetchWords returns parsed uppercase words', () => {
    const src = createBundledSource({ id: 'test', name: 'Test', text: 'hello world' })
    expect(src.fetchWords()).toEqual(['HELLO', 'WORLD'])
  })

  it('fetchWords handles punctuation in source text', () => {
    const src = createBundledSource({ id: 'test', name: 'Test', text: 'To be, or not to be.' })
    expect(src.fetchWords()).toContain('TO')
    expect(src.fetchWords()).toContain('BE')
    expect(src.fetchWords()).not.toContain('')
  })
})

describe('createUserTextSource', () => {
  it('has id user-input and name Custom Text', () => {
    const src = createUserTextSource({ getText: () => 'test' })
    expect(src.id).toBe('user-input')
    expect(src.name).toBe('Custom Text')
  })

  it('fetchWords calls getText and returns parsed words', async () => {
    const src = createUserTextSource({ getText: () => 'custom text input' })
    expect(await src.fetchWords()).toEqual(['CUSTOM', 'TEXT', 'INPUT'])
  })

  it('fetchWords returns null when getText returns empty string', async () => {
    const src = createUserTextSource({ getText: () => '' })
    expect(await src.fetchWords()).toBeNull()
  })

  it('fetchWords returns null when getText returns null (prompt cancelled)', async () => {
    const src = createUserTextSource({ getText: () => null })
    expect(await src.fetchWords()).toBeNull()
  })
})

describe('BUNDLED_TEXTS', () => {
  it('contains at least 3 entries', () => {
    expect(BUNDLED_TEXTS.length).toBeGreaterThanOrEqual(3)
  })

  it('each entry has id, name, and text fields', () => {
    for (const t of BUNDLED_TEXTS) {
      expect(t).toHaveProperty('id')
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('text')
    }
  })

  it('each text yields at least 10 words when parsed', () => {
    for (const t of BUNDLED_TEXTS) {
      const src = createBundledSource(t)
      expect(src.fetchWords().length).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('createTumblrSource', () => {
  let mockFetch

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('has id tumblr, name Tumblr, isNetworkSource true', () => {
    const src = createTumblrSource()
    expect(src.id).toBe('tumblr')
    expect(src.name).toBe('Tumblr')
    expect(src.isNetworkSource).toBe(true)
  })

  it('makes two fetch calls: total_posts then random post', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { total_posts: 100 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { posts: [{ body: '<p>hello world</p>' }] } }) })

    await createTumblrSource({ random: () => 0.5 }).fetchWords()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('uses random value to compute fetch offset from total_posts', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { total_posts: 100 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { posts: [{ body: '<p>hello</p>' }] } }) })

    await createTumblrSource({ random: () => 0.5 }).fetchWords()

    expect(mockFetch.mock.calls[1][0]).toContain('offset=50')
  })

  it('returns parsed words from post HTML body', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { total_posts: 10 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { posts: [{ body: '<p>Hello world foo</p>' }] } }) })

    const words = await createTumblrSource({ random: () => 0 }).fetchWords()

    expect(words).toEqual(['HELLO', 'WORLD', 'FOO'])
  })

  it('throws when first fetch returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })

    await expect(createTumblrSource().fetchWords()).rejects.toThrow()
  })

  it('throws when second fetch returns non-ok response', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { total_posts: 10 } }) })
      .mockResolvedValueOnce({ ok: false, status: 500 })

    await expect(createTumblrSource({ random: () => 0 }).fetchWords()).rejects.toThrow()
  })

  it('throws when response contains no posts', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { total_posts: 10 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: { posts: [] } }) })

    await expect(createTumblrSource({ random: () => 0 }).fetchWords()).rejects.toThrow()
  })
})
