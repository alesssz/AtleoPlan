/*
 * The one door to the API: what every request carries, how failures become an
 * ApiError, and the second try on an expired CSRF token. docs/concepts/C1-frontend.md C1.6.
 */
import { describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { fakeApi } from '@/test/auth-helpers'
import { ApiError, request } from './http'

/**
 * The headers of one call to the fake API.
 * @param fake the fake fetch
 * @param index which call, counting from 0
 */
function headersOf(fake: ReturnType<typeof fakeApi>, index: number) {
  return fake.mock.calls[index]?.[1]?.headers as Record<string, string>
}

describe('request', () => {
  it('asks for JSON in the current language', async () => {
    await i18n.changeLanguage('it')
    const fake = fakeApi({ 'GET /api/thing': { status: 200, body: { ok: true } } })

    const answer = await request<{ ok: boolean }>('/api/thing')

    expect(answer).toEqual({ ok: true })
    expect(headersOf(fake, 0)).toMatchObject({ 'Accept': 'application/json', 'Accept-Language': 'it' })
  })

  it('gets a CSRF cookie before the first change, and sends it back', async () => {
    // The fake server sets the cookie, as Laravel does on this path
    const fake = fakeApi({
      'GET /sanctum/csrf-cookie': () => {
        document.cookie = 'XSRF-TOKEN=abc%3D'
        return { status: 204 }
      },
    })

    await request('/api/thing', { method: 'POST', body: {} })

    // The first call fetched the cookie, the second is the request itself.
    // The value is decoded: %3D becomes =
    expect(fake.mock.calls[0]?.[0]).toBe('/sanctum/csrf-cookie')
    expect(headersOf(fake, 1)).toMatchObject({ 'X-XSRF-TOKEN': 'abc=' })
  })

  it('turns a validation failure into an ApiError with the field messages', async () => {
    fakeApi({ 'POST /api/thing': { status: 422, body: { message: 'Invalid', errors: { email: ['Wrong'] } } } })

    // rejects: the Promise must fail, and with this error
    await expect(request('/api/thing', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { email: ['Wrong'] },
    })
  })

  it('reports no connection as status 0', async () => {
    fakeApi({ 'GET /api/thing': 'network' })

    const error = await request('/api/thing').catch((failure: unknown) => failure)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0 })
  })

  it('tries again once on an expired token, with a fresh one', async () => {
    // Counts the calls, to answer 419 only to the first
    let calls = 0
    const fake = fakeApi({
      'POST /api/thing': () => {
        calls += 1
        return calls === 1 ? { status: 419, body: { message: 'expired' } } : { status: 200, body: { ok: true } }
      },
      'GET /sanctum/csrf-cookie': () => {
        document.cookie = 'XSRF-TOKEN=fresh'
        return { status: 204 }
      },
    })
    document.cookie = 'XSRF-TOKEN=old'

    await expect(request('/api/thing', { method: 'POST' })).resolves.toEqual({ ok: true })

    // old token, then a new cookie, then the fresh token
    expect(headersOf(fake, 0)).toMatchObject({ 'X-XSRF-TOKEN': 'old' })
    expect(fake.mock.calls[1]?.[0]).toBe('/sanctum/csrf-cookie')
    expect(headersOf(fake, 2)).toMatchObject({ 'X-XSRF-TOKEN': 'fresh' })
  })

  it('gives up after a second expired token', async () => {
    const fake = fakeApi({ 'POST /api/thing': { status: 419, body: { message: 'expired' } } })
    document.cookie = 'XSRF-TOKEN=old'

    await expect(request('/api/thing', { method: 'POST' })).rejects.toMatchObject({ status: 419 })

    // Two tries of the request itself, never a loop
    expect(fake.mock.calls.filter(([path]) => path === '/api/thing')).toHaveLength(2)
  })
})
