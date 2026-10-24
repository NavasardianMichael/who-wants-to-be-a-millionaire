'use client'

import { type FormEvent, useId, useState } from 'react'
import { Input, Space } from 'antd'
import { useTranslations } from 'next-intl'
import { useProfileStore } from '@store/profile/single/store'
import { toast } from '@store/toast/store'
import { useLeaveGuard } from '@hooks/useLeaveGuard'
import { Button } from '@components/ui/Button'

const MIN = 2
const MAX = 24

export const DisplayNameForm = ({ initial }: { initial: string }) => {
  const t = useTranslations('Profile')
  const tCommon = useTranslations('Common')
  const updateDisplayName = useProfileStore.use.updateDisplayName()
  const isSaving = useProfileStore.use.isSaving()
  const [value, setValue] = useState(initial)
  const [touched, setTouched] = useState(false)
  const id = useId()
  const hintId = useId()

  const trimmed = value.trim()
  const invalid = trimmed.length < MIN || trimmed.length > MAX
  const showError = touched && invalid
  useLeaveGuard(trimmed !== initial && 'unsaved')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (invalid || trimmed === initial) return
    if (await updateDisplayName(trimmed)) toast(tCommon('saved'), 'success')
  }

  return (
    <form onSubmit={submit} className='flex w-full flex-col gap-2 text-start' noValidate>
      <label htmlFor={id} className='font-semibold'>
        {t('displayName')}
      </label>
      <Space.Compact className='w-full'>
        <Input
          id={id}
          size='large'
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={MAX}
          status={showError ? 'error' : undefined}
          aria-invalid={showError}
          aria-describedby={hintId}
        />
        <Button type='submit' loading={isSaving} disabled={trimmed === initial} className='px-4'>
          {tCommon('save')}
        </Button>
      </Space.Compact>
      <p id={hintId} className={showError ? 'text-caption text-wrong-300' : 'text-caption text-mist'}>
        {showError ? t('displayNameError', { min: MIN, max: MAX }) : t('displayNameHint', { min: MIN, max: MAX })}
      </p>
    </form>
  )
}
