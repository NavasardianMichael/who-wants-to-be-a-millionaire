# AdSense setup — manual steps

The code is done. Ads stay off until you set one variable (step 3).

**What the app does by itself once that variable is set:**

- Loads Google **Auto ads** (Google picks ad places and sizes for phone, tablet and desktop).
- Ads appear only in the **48 languages AdSense supports**. The other 32 (Armenian, Georgian,
  Persian, Swahili…) never load ad code. AdSense forbids it.
- Ads appear only on content pages: home, leaderboard, categories, badges, rules, about,
  privacy, terms. **Never** on game screens (Classic, Marathon, Time Attack), sign-in, forms,
  settings, profile or 404 pages.
- Serves `/ads.txt`, adds the AdSense ownership meta tag, and shows an "Advertising" section on
  the privacy page (only in those 48 languages).

> **Audio:** the TV show's audio has been replaced. Every file in `public/audio/` is now
> public-domain (CC0); each source is listed in [`AUDIO_CREDITS.md`](AUDIO_CREDITS.md). Keep it
> that way. Copyrighted content can get the AdSense review rejected, or the account closed
> later.

---

## 1. Create the AdSense account

1. Go to <https://adsense.google.com> and sign in with your Google account.
2. Website: enter **`eapps.site`**. AdSense only accepts root domains; the game's subdomain is
   covered by it.
3. Fill in country, time zone and the payee name and address. They must match your bank account.

## 2. Copy your publisher ID

AdSense → **Account → Settings → Account information** → **Publisher ID** (`pub-1234567890123456`).

The app needs it with a `ca-` prefix: **`ca-pub-1234567890123456`**.

## 3. Give the ID to the app

1. GitHub repo → **Settings → Secrets and variables → Actions → Variables → New repository variable**.
2. Name: `NEXT_PUBLIC_ADSENSE_CLIENT`. Value: `ca-pub-1234567890123456`.
3. Redeploy: push any commit, or **Actions → Deploy → Run workflow**.
4. Check that <https://who-wants-to-be-a-millionaire.eapps.site/ads.txt> shows one line:
   `google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0`

## 4. Put ads.txt on the root domain

AdSense reads ads.txt from **`https://eapps.site/ads.txt`**, not from the subdomain. On the server
that serves `eapps.site`, add this to its nginx `server { … }` block (use your own ID):

```nginx
location = /ads.txt {
    default_type text/plain;
    return 200 "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n";
}
```

Then run `sudo nginx -t && sudo systemctl reload nginx`. Open <https://eapps.site/ads.txt> to check it.

## 5. Add the site and request review

1. AdSense → **Sites → + New site** → `eapps.site` → **Save**.
2. **Verify**: choose **Ads.txt snippet** (step 4 already did it) → **Verify**.
3. **Request review**. It takes from a few days to a few weeks, and you get an email.
   - AdSense reviews `eapps.site` itself. If that address shows no page of its own, make it
     redirect to the game (or show a real page) before you request review.

## 6. Turn on the consent message (Europe, UK, Switzerland)

This is required by Google. Without it, ads in those countries are limited.

1. AdSense → **Privacy & messaging → European regulations → Create message**.
2. **Select sites**: `eapps.site`. AdSense only takes root domains, so there is no separate
   entry for the game's subdomain. The message shows on `eapps.site` and **every subdomain**,
   wherever a page loads the ad code. Today that is only this game, but later it will be every
   app on the domain that shows ads. So the details below must be true for all of them, not
   just Millionaire.
3. Keep Google's default text, add the languages you want, choose a style, and fill in the site
   details:

   | Field | Value |
   |---|---|
   | Site name | **`eapps`**. Not `Millionaire`: the same message will greet visitors of every app on the domain. |
   | Logo | Turn the **Logo** toggle (Styling → Header) **off**, unless you have a logo for eapps as a whole. Don't use the game's icon. If the toggle is on but finds no logo, the message won't publish. |
   | Privacy policy URL | One page that covers every app that shows ads. While the game is the only one, **`https://who-wants-to-be-a-millionaire.eapps.site/privacy`** works; it redirects each visitor to the policy in their own language (if the form rejects a redirect, use `…/en/privacy`). Before a second app starts showing ads, publish a policy for the whole domain, e.g. `https://eapps.site/privacy`, and change the URL here. |
4. **Publish**. The ad code shows the message by itself, so no app change is needed.
5. Optional: do the same under **US state regulations**, also on `eapps.site`, with the same
   details.

## 7. Turn on Auto ads

AdSense → **Ads → By site** → pencil icon next to `eapps.site`. A preview of the site opens with
a settings panel beside it. The settings apply to `eapps.site` **and every subdomain**, so they
also apply to any other app on that domain that loads ad code.

The app already keeps ad code off game screens, forms and unsupported languages. These settings
only decide what Google shows on the content pages.

### Ad settings tab

**Auto ads: ON.**

**Intent-driven formats (Beta): leave all OFF** (links, anchors, chips). They turn words in the
page text into ad links. On the rules and categories pages those look like part of the game,
and they earn little until a player taps them.

**Overlay formats: keep all three ON**, then open **Advanced settings**:

| Setting | Choose | Why |
|---|---|---|
| Anchor ads | ON | The best-paying format on phones |
| → Select anchor ad position | **Bottom only** | The site's header is sticky at the top; an anchor there would stack on it |
| → Allow dynamic anchors | ✔ (default) | |
| → Allow anchor ads on screens wider than 1000px | ✘ uncheck | Side rails already cover desktop; a bottom bar there only covers content |
| Vignette ads | ON | |
| → Vignette ad frequency | the **longest** interval offered | See the note below |
| → Allow vignette ads on screens wider than 1000px | ✔ (default) | |
| → Allow additional triggers for vignette ads | ✘ uncheck | They fire on clicks within a page, not only between pages |
| Side rail ads | ON | Desktop only, in the empty space beside the content column |
| → Select side rail ad position | **Left and right** | |

> **Vignettes and Play:** a link from a content page to a game screen is a full page load
> (`AutoAds` forces it, so ad code never reaches the game). A vignette can show in exactly
> that moment: after **Play**, before the game. That's allowed, since it belongs to the page
> being left. But a player who starts many games would see it often, so keep the frequency
> interval long.

**In-page formats: keep both ON** (Banner ads, Multiplex ads), then under Banner ads →
**Advanced settings**:

| Setting | Choose | Why |
|---|---|---|
| Maximum number of ads on a page | low, about a third of the slider | The content pages are short (rules, badges, leaderboard); too many ads on a thin page counts against the review |
| Minimum distance between ads on a page | the default, or larger | |
| Find more ad placements on article pages | OFF | None of the pages are articles |
| Allow Google to optimize existing ads | leave as is | The app has no manual ad units, so it does nothing |

**Excluded areas: none.** **Excluded pages: none.** The app's own allow-list (`AD_ROUTES` in
`src/constants/ads.ts`) already keeps ads off everything else, in all 80 languages. A URL
list here would have to repeat that for every locale.

### Auto optimize tab

**Turn it OFF**, or at least untick **Auto-apply experiment winner**. It runs experiments on a
share of your traffic (half, by default) and applies the winning settings on its own. That
could turn back on what you switched off above. Revisit it once the site has a few weeks of
data.

### Save

**Apply to site**. It can take up to an hour to take effect.

## 8. Payments

1. AdSense → **Payments → Payments info**: add your bank account and tax information.
2. At $10 earned, Google mails a **PIN** to your address. Enter it under Payments.
3. Payouts happen monthly once the balance reaches $100.

## 9. Check that it works (after approval)

Use a private window, because an ad blocker or your own consent choice can hide ads:

| Open | Expect |
|---|---|
| `/en`, `/en/leaderboard`, `/de/rules` | Ads may appear (Google decides where and when) |
| `/en/play`, `/en/marathon`, `/en/sign-in` | No ads |
| `/hy`, `/ka`, `/fa` (unsupported languages) | No ads, no ad code |

Never click your own ads. AdSense counts that as invalid clicks and can close the account.

---

**To turn ads off:** delete the `NEXT_PUBLIC_ADSENSE_CLIENT` variable and redeploy.
**To change where ads may appear:** edit `AD_ROUTES` / `AD_LOCALES` in `src/constants/ads.ts`.
