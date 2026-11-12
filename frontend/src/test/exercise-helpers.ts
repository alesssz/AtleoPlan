/*
 * What the tests of the exercise library share: exercises, pages and the two
 * fixed lists, shaped as the backend sends them, to put in fakeApi's table
 * (src/test/auth-helpers.tsx); and a fake XMLHttpRequest for the photos'
 * uploads (fakeUploads). Tests and checks: docs/concepts/C1-frontend.md C1.10.
 */
import { vi } from 'vitest'
import type { Equipment } from '@/api/equipment'
import type { Exercise } from '@/api/exercises'
import type { Muscle } from '@/api/muscles'
import type { FakeAnswer } from './auth-helpers'

/** Three muscles, as GET /api/muscles sends them. */
export const testMuscles: Muscle[] = [
  { id: 6, slug: 'chest', name: 'Chest' },
  { id: 15, slug: 'shoulders', name: 'Shoulders' },
  { id: 17, slug: 'triceps', name: 'Triceps' },
]

/** Two kinds of equipment, as GET /api/equipment sends them. */
export const testEquipment: Equipment[] = [
  { id: 1, slug: 'barbell', name: 'Barbell' },
  { id: 11, slug: 'body-only', name: 'Body weight' },
]

/**
 * A public exercise, with two photos; `{ ...changes }` replaces some fields.
 * @param changes the fields to change
 */
export function testExercise(changes: Partial<Exercise> = {}): Exercise {
  return {
    id: 12,
    name: 'Barbell Bench Press',
    aliases: [],
    description: null,
    instructions: ['Lie on the bench.', 'Lower the bar to the chest.'],
    logging_type: 'weight_reps',
    youtube_url: null,
    is_mine: false,
    equipment: { id: 1, slug: 'barbell', name: 'Barbell' },
    muscles: [
      { id: 6, slug: 'chest', name: 'Chest', role: 'primary' },
      { id: 17, slug: 'triceps', name: 'Triceps', role: 'secondary' },
    ],
    photos: [{ id: 1, url: '/storage/1/conversions/0-large.webp', thumb_url: '/storage/1/conversions/0-thumb.webp' }, { id: 2, url: '/storage/2/conversions/1-large.webp', thumb_url: '/storage/2/conversions/1-thumb.webp' }],
    ...changes,
  }
}

/**
 * One page of GET /api/exercises.
 * @param exercises the page's exercises
 * @param meta where the page sits; one page of these exercises by default
 */
export function exercisePage(exercises: Exercise[], meta: { current_page?: number, last_page?: number, total?: number } = {}): FakeAnswer {
  return {
    status: 200,
    body: {
      data: exercises,
      meta: { current_page: 1, last_page: 1, total: exercises.length, ...meta },
    },
  }
}

/** The answers of the two fixed lists, for the filters and the editor. */
export const fixedLists = {
  'GET /api/muscles': { status: 200, body: { data: testMuscles } },
  'GET /api/equipment': { status: 200, body: { data: testEquipment } },
}

/** What the fake XMLHttpRequest records of each upload. */
export interface SentUpload {
  /** The address it was sent to. */
  path: string
  /** The form sent: `form.get('photo')` is the file. */
  form: FormData
  /** The headers set, by name. */
  headers: Record<string, string>
}

/**
 * Replaces the browser's XMLHttpRequest, which upload() in src/lib/http.ts
 * uses for its progress, as fakeApi() replaces fetch.
 *
 * Each send() reports half the file sent, then all of it, then answers
 * with `answer` on the next turn of the event loop (setTimeout 0), as a real
 * request answers later. `answer` may be a function, to answer differently
 * each time, or 'network' to fail as with no connection.
 *
 * @param answer the HTTP status and JSON body of every upload
 * @returns the list of uploads sent, filled as they happen
 */
export function fakeUploads(answer: FakeAnswer | 'network' | (() => FakeAnswer | 'network')): SentUpload[] {
  // Every upload sent, in order, for the test to read
  const sent: SentUpload[] = []

  /** The fake: only what upload() uses. */
  class FakeXhr {
    /** The status of the answer, once it has come. */
    status = 0
    /** The body of the answer, as text. */
    responseText = ''
    /** The progress of the sending, as XMLHttpRequest.upload has it. */
    upload: { onprogress: ((event: { lengthComputable: boolean, loaded: number, total: number }) => void) | null } = { onprogress: null }
    /** Called when the answer has come. */
    onload: (() => void) | null = null
    /** Called when there is no answer at all. */
    onerror: (() => void) | null = null
    /** The address and headers of this request. */
    private path = ''
    private headers: Record<string, string> = {}

    /**
     * Opens the request: remembers the address.
     * @param _method the method, always POST here
     * @param path the address
     */
    open(_method: string, path: string) {
      this.path = path
    }

    /**
     * Sets a header.
     * @param name the header's name
     * @param value its value
     */
    setRequestHeader(name: string, value: string) {
      this.headers[name] = value
    }

    /**
     * Sends the form: records it, reports progress, then answers.
     * @param form the form
     */
    send(form: FormData) {
      sent.push({ path: this.path, form, headers: this.headers })
      // The answer for this upload: the fixed one, or the function's
      const result = typeof answer === 'function' ? answer() : answer
      this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
      this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 })
      setTimeout(() => {
        if (result === 'network') {
          this.onerror?.()
          return
        }
        this.status = result.status
        this.responseText = result.body === undefined || result.body === null ? '' : JSON.stringify(result.body)
        this.onload?.()
      }, 0)
    }
  }

  // vi.stubGlobal(): replaces a global of the browser for this test;
  // src/test/setup.ts puts the real one back after each test (vi.unstubAllGlobals())
  vi.stubGlobal('XMLHttpRequest', FakeXhr)
  return sent
}
