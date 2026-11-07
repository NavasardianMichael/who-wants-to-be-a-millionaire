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
2. Select site `eapps.site`, keep Google's default text, add the languages you want, and choose a
   style.
3. **Publish**. The ad code shows the message by itself, so no app change is needed.
4. Optional: do the same under **US state regulations**.

## 7. Turn on Auto ads

1. AdSense → **Ads → By site** → pencil icon next to `eapps.site`.
2. **Auto ads: ON**.
3. **Ad formats**: keep them all (in-page, anchor, vignette, side rails). The app already keeps
   game screens and forms ad-free.
4. **Ad load**: start in the middle and adjust later.
5. **Apply to site**. It can take up to an hour.

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
