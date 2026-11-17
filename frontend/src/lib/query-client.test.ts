import { afterEach, describe, expect, it } from 'vitest'
import { authKeys } from '@/api/auth'
import { testUser } from '@/test/auth-helpers'
import { ApiError } from './http'
import { queryClient } from './query-client'

afterEach(() => {
  queryClient.clear()
})

describe('the app\'s query client', () => {
  it('forgets the account\'s data on a 401, not only who is signed in', async () => {
    queryClient.setQueryData(authKeys.user, testUser)
    queryClient.setQueryData(['plans', 'list', false], [{ id: 'plan-ppl' }])

    await queryClient.fetchQuery({
      queryKey: ['home'],
      queryFn: () => Promise.reject(new ApiError(401, 'Unauthenticated.')),
    }).catch(() => {})

    expect(queryClient.getQueryData(authKeys.user)).toBeNull()
    expect(queryClient.getQueryState(['plans', 'list', false])).toBeUndefined()
  })
})
