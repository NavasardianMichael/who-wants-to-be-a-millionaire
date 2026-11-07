# Audio credits

Every sound in `public/audio/` comes from [Freesound](https://freesound.org) under
**CC0 1.0** (public domain dedication). CC0 needs no attribution, and allows commercial use,
ads and edits. This file records where each sound came from and how it was edited, in case an
ad network or a takedown request asks.

Each license was checked on the sound's page on 2026-11-07. The source is Freesound's
128 kbps preview of each sound. Every file is cut, faded and levelled with ffmpeg: music to
about −20 LUFS, stings to about −16 LUFS, peaks below −1 dBFS. All are 44.1 kHz stereo
MP3s at 128 kbps.

| File | Role in the game | Source (author) | Edit |
|---|---|---|---|
| `main-theme.mp3` | Music outside a game | [The Pattern (loop)](https://freesound.org/people/SondreDrakensson/sounds/529291/) (SondreDrakensson) | levelled |
| `easy.mp3` | Questions 1–5 | [quiz game music loop BPM 90](https://freesound.org/people/portwain/sounds/220060/) (portwain) | levelled |
| `medium.mp3` | Questions 6–10 | [pad_quiz_timetoanswer_2](https://freesound.org/people/ct202/sounds/561810/) (ct202) | cut at 62.5 s, before its fade, on the beat, so it loops |
| `hard.mp3` | Questions 11 and on | [Tension Synth Loop](https://freesound.org/people/MarkAllentheProducer/sounds/727059/) (MarkAllentheProducer) | levelled |
| `select.mp3` | An answer picked (over the music) | [UIMisc_Digital, Selection, Confirmation 33](https://freesound.org/people/JW_Audio/sounds/828726/) (JW_Audio) | levelled |
| `start.mp3` | A game starts | [game-start](https://freesound.org/people/mickleness/sounds/269194/) (mickleness) | levelled |
| `final-answer.mp3` | Suspense after "final answer" | [Orchestral Hit](https://freesound.org/people/Rizzard/sounds/559391/) (Rizzard), [Timpani Roll](https://freesound.org/people/hallkev/sounds/428611/) (hallkev), [Heartbeat 97 BPM](https://freesound.org/people/Cloud-10/sounds/688735/) (Cloud-10), [Violins Suspense 2](https://freesound.org/people/Cunningar0807/sounds/378458/) (Cunningar0807) | the hit on the lock-in; the roll swells, then its loudest 2 s loop with crossfades; heartbeat and violins under it; 14 s, 1.5 s fade-out, about −15 LUFS |
| `correct-answer.mp3` | Correct answer | [Tada Fanfare G](https://freesound.org/people/plasterbrain/sounds/397353/) (plasterbrain) with [Crowd Applause Cheer](https://freesound.org/people/Nox_Sound/sounds/752709/) (Nox_Sound) | mixed: the cheer enters at 0.25 s; 2.6 s, 0.6 s fade-out, about −14 LUFS |
| `wrong-answer.mp3` | Wrong answer, time out | [basic trailer boom impact](https://freesound.org/people/harrisonlace/sounds/816376/) (harrisonlace), [Fail Sound (Wa-Wa-Wah)](https://freesound.org/people/YoshikaMiyafuji/sounds/835112/) (YoshikaMiyafuji), [aww](https://freesound.org/people/phmiller42/sounds/124996/) (phmiller42) | mixed: the crowd's "aww" enters at 0.55 s; 2.4 s, 0.5 s fade-out |
| `next.mp3` | Climb to the next question | [Riser Hit sfx 015](https://freesound.org/people/AudioPapkin/sounds/511863/) (AudioPapkin) | 0.5 s fade-out |
| `fifty-fifty.mp3` | 50:50 | [Vaporize02](https://freesound.org/people/n_audioman/sounds/320368/) (n_audioman) | twice, one per answer removed: the second 0.38 s later and a tone higher; 1 s |
| `audience-help.mp3` | Ask the audience | [Computer Rapid Bleeps and Bloops](https://freesound.org/people/SecureSubset/sounds/796092/) (SecureSubset) with [Healing Spell Chime](https://freesound.org/people/Assetsmith/sounds/876169/) (Assetsmith) | the votes counted (bleeps, 0.38–3.0 s of the source), then the chime at 2.55 s; 5 s, 0.6 s fade-out |
| `phone-a-friend.mp3` | Phone a friend | [Rotary Phone Ring loopable](https://freesound.org/people/cookies+policy/sounds/556499/) (cookies policy) | 0.2–5.6 s, 0.8 s fade-out |
| `you-won-a-million.mp3` | Winning the top prize | [Victory (short sting)](https://freesound.org/people/xkeril/sounds/706753/) (xkeril) with [Cheer & Applause](https://freesound.org/people/qubodup/sounds/830415/) (qubodup) | mixed: the applause enters at 0.4 s, 8 s in all |

## Replacing a sound

- **Use CC0 only.** CC-BY needs a visible credit. NonCommercial (NC) clips can't be used on a
  site with ads.
- **Avoid sound-alikes.** Skip anything described as "inspired by" a TV theme. For example,
  Freesound's "Countdown" by xkeril says it is modelled on the UK game show's clock music,
  and "Talk Show Theme Orchestra Fill" by Cloud-10 recreates the *Mission: Impossible* theme.
- **Fit the time limits.** A sting must say what it means within the time the game gives it
  (`maxWaitMs` in `src/store/game/session/store.ts`). Anything longer is faded out:

  | Sting | Time limit |
  |---|---|
  | `fifty-fifty` | 1.2 s |
  | `wrong-answer` | as `correct-answer`; 2 s on a time-out |
  | `correct-answer` | 2.6 s in Classic, 1.4 s in Marathon, 0.65 s in Time Attack |
  | `final-answer` | the reveal: 2.5–4 s in Classic, 1 s in Marathon (none in Time Attack) |
  | `next` | 3 s |
  | `audience-help` | 5.5 s |
  | `start` | 6 s |
  | `phone-a-friend` | 9.5 s |

- **Bump the version.** Raise `SOUND_VERSION` in `src/helpers/audio/sounds.ts`. It is part of
  every sound's URL, so browsers and installed apps fetch the new file instead of playing the
  copy they have cached.
