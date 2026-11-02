'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { Rule } from 'antd/es/form'
import { useTranslations } from 'next-intl'
import { AUTH_ERROR_CODE, type AuthErrorKey, DISPLAY_NAME_LIMITS, isStrongPassword, PASSWORD_LIMITS } from '@constants/auth'
import { classifyError } from '@helpers/error'

const CODE_TO_KEY = new Map<number, AuthErrorKey>(
  (Object.entries(AUTH_ERROR_CODE) as [AuthErrorKey, number][]).map(([key, code]) => [code, key])
)

/** The API's code for a failure the auth forms explain themselves (`Auth.codes.*`), if it is one. */
export const authErrorKey = (error: unknown): AuthErrorKey | undefined => {
  const { code } = classifyError(error)
  return code === null ? undefined : CODE_TO_KEY.get(code)
}

/**
 * Copy for `ErrorAlert`'s `message`: the form's own sentence for a known code, `undefined`
 * otherwise, so the alert falls back to its copy by error kind (network, rate limit, …).
 */
export const useAuthErrorMessage = () => {
  const t = useTranslations('Auth.codes')
  return useCallback(
    (error: unknown): string | undefined => {
      const key = authErrorKey(error)
      return key && t(key, { min: key === 'weakPassword' ? PASSWORD_LIMITS.min : DISPLAY_NAME_LIMITS.min, max: DISPLAY_NAME_LIMITS.max })
    },
    [t]
  )
}

/** Mirrors `validatePassword` on the server, so the form says it before the API does. */
export const passwordRules = (requiredMessage: string, weakMessage: string): Rule[] => [
  { required: true, message: requiredMessage },
  {
    validator: (_rule, value: string | undefined) =>
      !value || isStrongPassword(value) ? Promise.resolve() : Promise.reject(new Error(weakMessage)),
  },
]

/** The repeat field: equal to `field`. The item must list `field` in `dependencies` to recheck as it changes. */
export const confirmPasswordRules = (field: string, requiredMessage: string, mismatchMessage: string): Rule[] => [
  { required: true, message: requiredMessage },
  ({ getFieldValue }) => ({
    validator: (_rule, value: string | undefined) =>
      !value || value === getFieldValue(field) ? Promise.resolve() : Promise.reject(new Error(mismatchMessage)),
  }),
]

const noSubscription = () => () => undefined

/**
 * One query parameter of the current URL, read from `window.location` — `useSearchParams`
 * would need a `<Suspense>` boundary or turn the page client-rendered. `undefined` while
 * prerendered and hydrating, then the value (or `null`).
 */
export const useQueryParam = (name: string): string | null | undefined =>
  useSyncExternalStore(
    noSubscription,
    () => new URLSearchParams(window.location.search).get(name),
    () => undefined
  )
