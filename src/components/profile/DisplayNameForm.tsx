'use client'

import { type FormEvent, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useProfileStore } from '@store/profile/single/store'
import { toast } from '@store/toast/store'
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

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (invalid || trimmed === initial) return
    if (await updateDisplayName(trimmed)) toast(tCommon('saved'), 'success')
  }

  return (
    <form onSubmit={submit} className='flex w-full flex-col gap-2' noValidate>
      <label htmlFor={id} className='font-semibold'>
        {t('displayName')}
      </label>
      <div className='flex gap-2'>
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={MAX}
          aria-invalid={touched && invalid}
          aria-describedby={hintId}
          className='h-12 min-w-0 flex-1 rounded-full border border-spot-300/25 bg-studio-950/70 px-4 text-ivory focus:border-gold-300 focus:outline-none aria-invalid:border-wrong-500'
        />
        <Button type='submit' loading={isSaving} disabled={trimmed === initial}>
          {tCommon('save')}
        </Button>
      </div>
      <p id={hintId} className={touched && invalid ? 'text-caption text-wrong-300' : 'text-caption text-mist'}>
        {touched && invalid ? t('displayNameError', { min: MIN, max: MAX }) : t('displayNameHint', { min: MIN, max: MAX })}
      </p>
    </form>
  )
}
