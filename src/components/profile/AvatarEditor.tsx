'use client'

import { Spin, Upload } from 'antd'
import ImgCrop from 'antd-img-crop'
import { Camera, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useProfileStore } from '@store/profile/single/store'
import { toast } from '@store/toast/store'
import type { SessionUser } from '@interfaces/entities'
import { Avatar } from '@components/ui/bare/Avatar'
import { Button } from '@components/ui/Button'
import { ErrorAlert } from '@components/ui/ErrorAlert'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

/**
 * Pick → crop (antd-img-crop: a round mask, zoom and rotate, in an antd Modal) → upload.
 * `Upload` never sends anything itself (`beforeUpload` returns false); the cropped file goes
 * through the profile store like every other API call. Size and type are checked before the
 * cropper opens only to save a doomed upload — the server decides.
 */
export const AvatarEditor = ({ user }: { user: SessionUser }) => {
  const t = useTranslations('Profile')
  const tCommon = useTranslations('Common')
  const uploadAvatar = useProfileStore.use.uploadAvatar()
  const removeAvatar = useProfileStore.use.removeAvatar()
  const isSaving = useProfileStore.use.isSaving()
  const saveError = useProfileStore.use.saveError()

  const check = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast(t('avatarInvalid'), 'error')
      return false
    }
    if (file.size > MAX_BYTES) {
      toast(t('avatarTooLarge'), 'error')
      return false
    }
    return true
  }

  const upload = async (file: File) => {
    if (await uploadAvatar(file)) toast(tCommon('saved'), 'success')
  }

  return (
    <div className='flex flex-col items-center gap-3'>
      <Spin spinning={isSaving}>
        <div className='relative'>
          <Avatar name={user.displayName} url={user.avatarUrl} size='xl' className='shadow-glow-gold' />
          <ImgCrop
            cropShape='round'
            rotationSlider
            showReset={false}
            quality={0.92}
            modalTitle={t('changeAvatar')}
            modalOk={tCommon('save')}
            modalCancel={tCommon('cancel')}
            beforeCrop={check}
          >
            <Upload
              accept={ACCEPT}
              showUploadList={false}
              disabled={isSaving}
              beforeUpload={(file) => {
                void upload(file)
                return false
              }}
              className='absolute inset-e-0 bottom-0'
            >
              {/* Upload wraps this in its own focusable `role="button"`; the hidden text names it. */}
              <span className='flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-studio-950 bg-gold-400 text-studio-950 transition-transform hover:scale-105'>
                <Camera aria-hidden className='size-5' />
                <span className='sr-only'>{t('changeAvatar')}</span>
              </span>
            </Upload>
          </ImgCrop>
        </div>
      </Spin>
      <p className='text-caption text-mist'>{t('avatarHint')}</p>
      {Boolean(saveError) && <ErrorAlert error={saveError} message={t('avatarInvalid')} className='w-full text-start' />}
      {user.hasUploadedAvatar && (
        <Button variant='ghost' size='sm' onClick={() => void removeAvatar()} icon={<Trash2 aria-hidden className='size-4' />}>
          {t('removeAvatar')}
        </Button>
      )}
    </div>
  )
}
