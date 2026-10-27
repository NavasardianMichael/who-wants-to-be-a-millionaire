# Production setup

The one-time, app-specific steps to run Millionaire Quiz on the server, in order. Assumed to be
in place already, so nothing here creates a user or installs them:

- the existing `michael` user, with sudo
- Node 24, and pnpm in `/home/michael/.local/bin`
- Docker, with `michael` in the `docker` group: the deploy runs `docker compose` as `michael`,
  without sudo, to create the database (`groups michael` lists `docker`)
- nginx and certbot

How the pipeline works is in [DEPLOYMENT.md](DEPLOYMENT.md).

Nothing is downloaded on the server. Each step links the files from this repo's `deployment/`
folder, each followed by the command that creates and opens it on the server. Open the repo file,
copy all of it, run the command, paste into nano (right-click, or `Ctrl+Shift+V`), then save
with `Ctrl+O`, `Enter` and exit with `Ctrl+X`. Then run that step's commands.

To update a file that is already there, empty it first, then open and paste as above:
`sudo truncate -s 0 <path>`.

**[DNS]** DNS provider · **[PC]** your machine, repo root · **[SRV]** server, as `michael` ·
**[GCP]** Google Cloud console · **[GH]** GitHub repo settings

Each step is marked **(once)**, done once for the app, or **(any time)**, safe to repeat. A
deploy never touches the files these steps put on the server, so when one of them changes in
the repo, its step says what to redo.

## Environment: two layers

The app (Next.js) and the server (Express API) each have their own settings, in development and
in production:

|            | Development                                                   | Production                                                                                         |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **App**    | `.env.local` in the repo root, from [.env.example](../.env.example)         | one GitHub secret per key (step 7), built into the bundle by the pipeline. No file on the server. |
| **Server** | `server/.env.development.local`, from [server/.env.example](../server/.env.example) | `server/.env.production.local` on your PC → `ENV_API_BASE64` (steps 6–7) → the pipeline writes `/home/michael/apps/who-wants-to-be-a-millionaire/shared/.env.api` |

The app's values are all public: every `NEXT_PUBLIC_*` value ends up in the browser bundle. The
server's are secret: the database password, the session signing key, the Google client secret,
the Gemini key and the mail engine key.

## 1. DNS **[DNS]** (once)

| Type  | Name                                           | Value                                      | Serves                                                         |
| ----- | ---------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| A     | `who-wants-to-be-a-millionaire.eapps.site`     | `<SERVER_IPV4>`                            | the app (HTTP → HTTPS)                                         |
| AAAA  | `who-wants-to-be-a-millionaire.eapps.site`     | `<SERVER_IPV6>`                            | the app (HTTP → HTTPS)                                         |
| CNAME | `www.who-wants-to-be-a-millionaire.eapps.site` | `who-wants-to-be-a-millionaire.eapps.site` | redirect to `https://who-wants-to-be-a-millionaire.eapps.site` |
| A     | `api.who-wants-to-be-a-millionaire.eapps.site` | `<SERVER_IPV4>`                            | the API, HTTPS only                                            |
| AAAA  | `api.who-wants-to-be-a-millionaire.eapps.site` | `<SERVER_IPV6>`                            | the API, HTTPS only                                            |

The IPv6 address must really reach the server: Let's Encrypt checks over IPv6 first, so a wrong
AAAA record makes certbot fail. If the zone is on Cloudflare, set every record to **DNS only**.

## 2. systemd units **[SRV]** (once)

Paste [millionaire-web.service](../deployment/millionaire-web.service) into:

```bash
sudo nano /etc/systemd/system/millionaire-web.service
```

Paste [millionaire-api.service](../deployment/millionaire-api.service) into:

```bash
sudo nano /etc/systemd/system/millionaire-api.service
```

`sudo nano` creates them owned by `root`, mode `644`. Then load them and start them on every
boot:

```bash
sudo systemctl daemon-reload
sudo systemctl enable millionaire-web millionaire-api
```

Then let the deploy workflow restart the two services, and nothing else, without a password.
Open the rule file in nano through `visudo`, which checks the syntax on save and creates the
file with the mode `440` that sudo requires:

```bash
sudo EDITOR=nano visudo -f /etc/sudoers.d/millionaire-deploy
```

Paste this line, then save and exit as above:

```text
michael ALL=(root) NOPASSWD: /usr/bin/systemctl restart millionaire-web, /usr/bin/systemctl restart millionaire-api
```

The path must be where `systemctl` really is; `command -v systemctl` prints it, and
`/usr/bin/systemctl` is the usual one. Check the rule works, without running anything: each
command prints the full `systemctl` command if the rule allows it, and
`sudo: a password is required` if it does not:

```bash
sudo -k
sudo -n -l /usr/bin/systemctl restart millionaire-web
sudo -n -l /usr/bin/systemctl restart millionaire-api
```

Do not test it with a real restart yet: before the first deploy the services have nothing to
run, so `systemctl restart` fails with "unavailable resources" (their release directory, env
file and `shared/uploads` are created by the first deploy), even when the rule is right.

If a `.service` file changes in the repo later, paste it again, then run
`sudo systemctl daemon-reload && sudo systemctl restart <that unit>`.

## 3. Certificates, auto-renewing **[SRV]** (once)

The vhosts in step 4 reference these certificates, so issue them first. There are two: one for
the app that also covers `www`, and one for the API. `certonly --nginx` lets certbot answer
Let's Encrypt's check through nginx by itself and only fetches the certificate: it never edits
a vhost file.

certbot's nginx plugin is needed. If `sudo certbot plugins` does not list `nginx`, install it
with `sudo apt install python3-certbot-nginx`.

```bash
sudo certbot certonly --nginx -d who-wants-to-be-a-millionaire.eapps.site -d www.who-wants-to-be-a-millionaire.eapps.site --deploy-hook "systemctl reload nginx"
sudo certbot certonly --nginx -d api.who-wants-to-be-a-millionaire.eapps.site --deploy-hook "systemctl reload nginx"
```

Each certificate renews by itself: certbot's timer renews it before it expires, the same way it
was issued, and the `--deploy-hook`, saved in each renewal config, reloads nginx afterwards.
The timer is one for the whole server, shared with the other apps' certificates, so there is
nothing to set up for it here.

Check these two certificates only. The dry run asks for test certificates and changes nothing;
each should end with "all simulated renewals succeeded":

```bash
sudo certbot renew --dry-run --cert-name who-wants-to-be-a-millionaire.eapps.site
sudo certbot renew --dry-run --cert-name api.who-wants-to-be-a-millionaire.eapps.site
```

And see what they cover and when they expire:

```bash
sudo certbot certificates --cert-name who-wants-to-be-a-millionaire.eapps.site
sudo certbot certificates --cert-name api.who-wants-to-be-a-millionaire.eapps.site
```

## 4. nginx **[SRV]** (once)

Paste [who-wants-to-be-a-millionaire.eapps.site.conf](../deployment/who-wants-to-be-a-millionaire.eapps.site.conf) into:

```bash
sudo nano /etc/nginx/sites-available/who-wants-to-be-a-millionaire.eapps.site.conf
```

Paste [api.who-wants-to-be-a-millionaire.eapps.site.conf](../deployment/api.who-wants-to-be-a-millionaire.eapps.site.conf) into:

```bash
sudo nano /etc/nginx/sites-available/api.who-wants-to-be-a-millionaire.eapps.site.conf
```

`sudo nano` creates them owned by `root`, mode `644`. Then enable them:

```bash
sudo ln -sf /etc/nginx/sites-available/who-wants-to-be-a-millionaire.eapps.site.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.who-wants-to-be-a-millionaire.eapps.site.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Run the reload only if `nginx -t` says `syntax is ok` and `test is successful`.

If a `.conf` file changes in the repo later, paste it again, then run
`sudo nginx -t && sudo systemctl reload nginx`.

## 5. Google sign-in **[GCP]** (once)

Google Cloud console → APIs & Services → Credentials → **Create credentials** → OAuth client
ID → Web application. Under **Authorized redirect URIs** add, character for character:

```text
https://api.who-wants-to-be-a-millionaire.eapps.site/identity/google/callback
```

No JavaScript origins are needed: the browser never talks to Google directly. Keep the client
ID and secret for step 6. Publish the OAuth consent screen before real users arrive.

Sign-in is optional: leave the three `GOOGLE_*` values empty in step 6 and every run is a guest
run (refereed, but off the leaderboard).

## 6. Server environment **[PC]** (once)

Everything in this step runs on **your PC**, in the repo root, never on the server. Any
terminal works: PowerShell, Command Prompt, Git Bash, or the VS Code terminal.

First, two random values. The first deploy creates the database (a Postgres 16 container on
`127.0.0.1:5006`) from `DATABASE_URL`, so the first value becomes the database password.
Generate it once and keep it in your password manager. Changing it later does not change the
password of the database already created. This prints 64 random hex characters (Node only, so
it is the same command in every terminal):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The second signs the session cookie, `JWT_SECRET`. Changing it later signs everybody out:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`server/.env.production.local` (git-ignored). Put the database password after `millionaire:`,
the session key in `JWT_SECRET`, your key from https://aistudio.google.com/apikey in
`GEMINI_KEY`, the client from step 5 in `GOOGLE_*`, and the mail engine key in `MAIL_API_KEY`:

```dotenv
DATABASE_URL="postgresql://millionaire:<database password>@127.0.0.1:5006/millionaire?schema=public"
JWT_SECRET="<session key>"
CORS_ORIGIN="https://who-wants-to-be-a-millionaire.eapps.site"
GEMINI_KEY=""
VERIFY_QUESTIONS="false"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="https://api.who-wants-to-be-a-millionaire.eapps.site/identity/google/callback"
MAIL_API_URL="https://api-mail-engine.mnavasardian.com"
MAIL_API_KEY=""
MAIL_APP_ID="millionaire"
```

The first three are required. The others in part A of
[server/.env.example](../server/.env.example) are optional: an empty `GEMINI_KEY` serves games
from the pool and the English bank only, empty `GOOGLE_*` turns sign-in off, and an empty
`MAIL_API_KEY` makes the contact form answer 503. Leave out `NODE_ENV`, `PORT`, `HOST` and
`UPLOAD_DIR`: the pipeline sets them itself.

Generate the `ENV_API_BASE64` value from it, straight to the clipboard. `clip` is Windows and
works in PowerShell, Command Prompt and Git Bash alike (on macOS use `| pbcopy`):

```bash
pnpm env:base64 production | clip
```

It prints only the base64 to the clipboard and lists the key names (never values) in the
terminal, with a warning for anything that looks wrong. Check those keys before pasting.

If this file changes later, run the command again and update the `ENV_API_BASE64` secret.

## 7. GitHub secrets **[GH]** (once)

Settings → Secrets and variables → Actions → **Secrets** tab → **Repository secrets** → **New
repository secret**. Every value below goes there: not in the Variables tab, and not under
Settings → Environments, whose secrets the deploy jobs cannot read (a value there arrives
empty, and the build stops with "NEXT_PUBLIC_API_URL is empty").

Deploy and server layer:

| Name                   | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| `SSH_HOST`             | `<SERVER_IPV4>`                                          |
| `SSH_USER`             | `michael`                                                |
| `SSH_KEY`              | your existing private key (its public half is already in `/home/michael/.ssh/authorized_keys`), BEGIN to END lines |
| `APP_DIR`              | `/home/michael/apps/who-wants-to-be-a-millionaire`       |
| `ENV_API_BASE64`       | output of step 6                                         |

App layer, the production twins of the keys in `.env.local`. The first two are required: the
build stops if either is empty. The rest are optional, and an empty or missing one turns that
feature off:

| Name                                    | Value                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                   | `https://api.who-wants-to-be-a-millionaire.eapps.site`                             |
| `NEXT_PUBLIC_SITE_URL`                  | `https://who-wants-to-be-a-millionaire.eapps.site` (must equal `CORS_ORIGIN` in step 6) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`         | Google Analytics 4 → Admin → Data streams → `G-…`                                  |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`  | Google Search Console → HTML tag → the `content` value                             |
| `NEXT_PUBLIC_SENTRY_DSN`                | Sentry → project → Client Keys (DSN)                                               |
| `SENTRY_ORG`, `SENTRY_PROJECT`          | Sentry organization and project slugs, for uploading source maps                   |
| `SENTRY_AUTH_TOKEN`                     | Sentry → Settings → Auth Tokens; lets the build upload source maps                 |

A saved secret cannot be viewed again, and logs show it as `***`. To check or fix one, overwrite
it with the right value.

Unlike `.env.local`, these are not a file: change one here, then redeploy the web (re-run
**Deploy to Production**), because they are built into the bundle.

## 8. First deploy **[GH]** (once)

Actions → **Deploy to Production** → **Run workflow** (deploys both sides). After
that, every merge to `master` deploys automatically, and every pull request runs **CI** first.

Check it (any time):

```powershell
curl.exe -s  https://api.who-wants-to-be-a-millionaire.eapps.site/health   # "status":"ok", "google":true, "gemini":true
curl.exe -sI https://who-wants-to-be-a-millionaire.eapps.site/en           # 200
curl.exe -sI https://www.who-wants-to-be-a-millionaire.eapps.site          # 301 -> https://who-wants-to-be-a-millionaire.eapps.site
```
