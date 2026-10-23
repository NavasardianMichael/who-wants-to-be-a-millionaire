'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useProfileStore } from '@store/profile/single/store'
import { toast } from '@store/toast/store'
import type { SessionUser } from '@interfaces/entities'
import { Avatar } from '@components/ui/bare/Avatar'
import { Button } from '@components/ui/Button'
import { Dialog } from '@components/ui/Dialog'
import { ErrorAlert } from '@components/ui/ErrorAlert'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

/**
 * Pick → preview in the same circle the leaderboard uses → upload. The server crops to a
 * centred square (`sharp`, attention-based), so the preview shows exactly that framing.
 * Size and type are checked here first only to save a doomed upload; the server decides.
 */
export const AvatarEditor = ({ user }: { user: SessionUser }) => {
  const t = useTranslations('Profile')
  const tCommon = useTranslations('Common')
  const uploadAvatar = useProfileStore.use.uploadAvatar()
  const removeAvatar = useProfileStore.use.removeAvatar()
  const isSaving = useProfileStore.use.isSaving()
  const saveError = useProfileStore.use.saveError()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // The object URL is created on pick and revoked on close, so a preview never outlives its dialog.
  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    if (!picked.type.startsWith('image/')) return toast(t('avatarInvalid'), 'error')
    if (picked.size > MAX_BYTES) return toast(t('avatarTooLarge'), 'error')
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
  }

  const close = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }

  const confirm = async () => {
    if (file && (await uploadAvatar(file))) {
      toast(tCommon('saved'), 'success')
      close()
    }
  }

  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='relative'>
        <Avatar name={user.displayName} url={user.avatarUrl} size='xl' className='shadow-glow-gold' />
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          aria-label={t('changeAvatar')}
          className='absolute inset-e-0 bottom-0 flex size-10 items-center justify-center rounded-full border-2 border-studio-950 bg-gold-400 text-studio-950 transition-transform hover:scale-105'
        >
          <Camera aria-hidden className='size-5' />
        </button>
      </div>
      <input ref={inputRef} type='file' accept={ACCEPT} onChange={onPick} className='sr-only' tabIndex={-1} aria-hidden />
      <p className='text-caption text-mist'>{t('avatarHint')}</p>
      {user.hasUploadedAvatar && (
        <Button variant='ghost' size='sm' onClick={() => void removeAvatar()} icon={<Trash2 aria-hidden className='size-4' />}>
          {t('removeAvatar')}
        </Button>
      )}

      <Dialog
        open={Boolean(file)}
        onClose={close}
        title={t('changeAvatar')}
        footer={
          <>
            <Button variant='ghost' onClick={close}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={confirm} loading={isSaving}>
              {tCommon('save')}
            </Button>
          </>
        }
      >
        <div className='flex flex-col items-center gap-4'>
          {preview && <img src={preview} alt={t('avatarPreview')} className='size-48 rounded-full border-2 border-gold-300 object-cover shadow-glow-gold' />}
          {Boolean(saveError) && <ErrorAlert error={saveError} message={t('avatarInvalid')} className='w-full' />}
        </div>
      </Dialog>
    </div>
  )
}
