'use client'

import { useTranslations } from 'next-intl'
import { useSettingsStore } from '@store/settings/store'
import { CATEGORIES, type Category, type Lifeline, LIFELINES } from '@constants/game'
import { DIFFICULTIES, type Difficulty, TIMER_OPTIONS, type TimerSetting } from '@helpers/game/settings'
import { Button } from '@components/ui/Button'
import { Chip } from '@components/ui/Chip'
import { SegmentedControl } from '@components/ui/SegmentedControl'
import { Toggle } from '@components/ui/Toggle'

/**
 * Classic's custom game: categories, difficulty, time limit and lifelines. Saved on the
 * device and used by every Classic game until reset; Marathon and Time Attack are ranked and
 * always play the standard rules.
 */
export const GameSettingsForm = () => {
  const t = useTranslations()
  const settings = useSettingsStore.use.game()
  const setGameSettings = useSettingsStore.use.setGameSettings()
  const resetGameSettings = useSettingsStore.use.resetGameSettings()

  const toggleCategory = (category: Category) =>
    setGameSettings({
      categories: settings.categories.includes(category)
        ? settings.categories.filter((each) => each !== category)
        : [...settings.categories, category],
    })

  const toggleLifeline = (lifeline: Lifeline, on: boolean) =>
    setGameSettings({ lifelines: on ? [...settings.lifelines, lifeline] : settings.lifelines.filter((each) => each !== lifeline) })

  const timerLabel = (option: TimerSetting) =>
    option === 'classic' ? t('Settings.timerClassic') : option === 'off' ? t('Settings.timerOff') : t('Common.secondsShort', { count: option })

  return (
    <div className='flex flex-col gap-6'>
      <p className='text-body-sm text-mist'>{t('Settings.gameHint')}</p>

      <fieldset className='flex flex-col gap-3'>
        <legend className='mb-1 font-semibold'>{t('Settings.categories')}</legend>
        <p className='-mt-2 text-body-sm text-mist'>{t('Settings.categoriesHint')}</p>
        <div className='flex flex-wrap gap-2'>
          <Chip label={t('Settings.allCategories')} selected={settings.categories.length === 0} onToggle={() => setGameSettings({ categories: [] })} />
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={t(`Categories.names.${category}`)}
              selected={settings.categories.includes(category)}
              onToggle={() => toggleCategory(category)}
            />
          ))}
        </div>
      </fieldset>

      <div className='flex flex-col gap-2'>
        <span className='font-semibold'>{t('Settings.difficulty')}</span>
        <SegmentedControl<Difficulty>
          label={t('Settings.difficulty')}
          value={settings.difficulty}
          onChange={(difficulty) => setGameSettings({ difficulty })}
          options={DIFFICULTIES.map((value) => ({ value, label: t(`Settings.difficulty${value[0]!.toUpperCase()}${value.slice(1)}`) }))}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <span className='font-semibold'>{t('Settings.timer')}</span>
        <SegmentedControl<TimerSetting>
          label={t('Settings.timer')}
          value={settings.timer}
          onChange={(timer) => setGameSettings({ timer })}
          options={TIMER_OPTIONS.map((value) => ({ value, label: timerLabel(value) }))}
        />
        {settings.timer === 'classic' && <p className='text-caption text-mist'>{t('Settings.timerClassicHint')}</p>}
      </div>

      <fieldset className='flex flex-col gap-3'>
        <legend className='mb-1 font-semibold'>{t('Settings.lifelines')}</legend>
        {LIFELINES.map((lifeline) => (
          <Toggle
            key={lifeline}
            label={t(`Lifelines.${lifeline}`)}
            description={t(`Lifelines.${lifeline}Description`)}
            checked={settings.lifelines.includes(lifeline)}
            onChange={(on) => toggleLifeline(lifeline, on)}
          />
        ))}
      </fieldset>

      <Button variant='outline' size='sm' onClick={resetGameSettings} className='self-start'>
        {t('Settings.reset')}
      </Button>
    </div>
  )
}
