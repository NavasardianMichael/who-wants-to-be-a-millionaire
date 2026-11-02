import { readFileSync } from 'node:fs'
import path from 'node:path'
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales.js'
import { escapeHtml, type MailResult, sendAccountMail } from './mail.js'
import { prisma } from './prisma.js'
import { ACCOUNT_PATH, buildWebUrl, TOKEN_QUERY } from './return-path.js'
import { hashUrlToken, mintUrlToken } from './token.js'
import { config } from '../config.js'

/**
 * The emails about an account: verify the address, reset the password, "your password
 * changed". Written in the reader's language — the copy is the `Email` namespace of the web
 * app's catalogues, so `pnpm i18n:sync` translates it with everything else — and every link
 * opens the site in that language.
 */

type EmailCopy = Record<string, string>

const RTL_LOCALES = new Set<Locale>(['ar', 'ur', 'fa', 'he'])

const readCopy = (locale: Locale): EmailCopy => {
  try {
    const catalogue = JSON.parse(readFileSync(path.join(config.messagesDir, `${locale}.json`), 'utf8')) as {
      Email?: EmailCopy
    }
    return catalogue.Email ?? {}
  } catch {
    return {}
  }
}

const copyCache = new Map<Locale, EmailCopy>()

/** A locale's copy over English, so a key the sync has not reached yet still reads. */
const copyFor = (locale: Locale): EmailCopy => {
  const cached = copyCache.get(locale)
  if (cached) return cached

  const english = readCopy(DEFAULT_LOCALE)
  // A release without its catalogues would mail blank pages; fail the request instead.
  if (!english.verifySubject) throw new Error(`Email copy not found in ${config.messagesDir || '(no messages dir)'}`)
  const copy = { ...english, ...readCopy(locale) }
  copyCache.set(locale, copy)
  return copy
}

/** The language a mail is written in: the page the request came from, else the account's own. */
export const mailLocale = (requested: unknown, accountLocale: string): Locale =>
  isLocale(requested) ? requested : isLocale(accountLocale) ? accountLocale : DEFAULT_LOCALE

const fill = (template: string, values: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)

type Letter = { subject: string; lead: string; action: { label: string; url: string }; footer: string }

/** Every value is escaped: a display name is the reader's own input, and copy is machine-translated. */
const render = (locale: Locale, { subject, lead, action, footer }: Letter) => ({
  subject,
  text: `${lead}\n\n${action.url}\n\n${footer}`,
  html:
    `<div dir="${RTL_LOCALES.has(locale) ? 'rtl' : 'ltr'}">` +
    `<p>${escapeHtml(lead)}</p>` +
    `<p><a href="${escapeHtml(action.url)}">${escapeHtml(action.label)}</a></p>` +
    `<p>${escapeHtml(footer)}</p>` +
    '</div>',
})

const pageUrl = (locale: Locale, pagePath: string, params: Record<string, string> = {}): string =>
  buildWebUrl(config.corsOrigin, `/${locale}${pagePath}`, params)

type Recipient = { id: string; email: string; displayName: string }

/** A new link replaces the previous one: only the latest email in the inbox works. */
const issueEmailVerifyToken = async (userId: string): Promise<string> => {
  const token = mintUrlToken()
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifyTokenHash: hashUrlToken(token), emailVerifyExpiresAt: new Date(Date.now() + config.emailVerifyTtlMs) },
  })
  return token
}

const issuePasswordResetToken = async (userId: string): Promise<string> => {
  const token = mintUrlToken()
  await prisma.user.update({
    where: { id: userId },
    data: { passwordResetTokenHash: hashUrlToken(token), passwordResetExpiresAt: new Date(Date.now() + config.passwordResetTtlMs) },
  })
  return token
}

export const sendVerificationLink = async (user: Recipient, locale: Locale): Promise<MailResult> => {
  const copy = copyFor(locale)
  const url = pageUrl(locale, ACCOUNT_PATH.verifyEmail, { [TOKEN_QUERY]: await issueEmailVerifyToken(user.id) })
  return sendAccountMail('Email verification', {
    to: user.email,
    ...render(locale, {
      subject: copy.verifySubject,
      lead: fill(copy.verifyLead, { name: user.displayName }),
      action: { label: copy.verifyButton, url },
      footer: copy.verifyFooter,
    }),
  })
}

export const sendPasswordResetLink = async (user: Recipient, locale: Locale): Promise<MailResult> => {
  const copy = copyFor(locale)
  const url = pageUrl(locale, ACCOUNT_PATH.resetPassword, { [TOKEN_QUERY]: await issuePasswordResetToken(user.id) })
  return sendAccountMail('Password reset', {
    to: user.email,
    ...render(locale, {
      subject: copy.resetSubject,
      lead: fill(copy.resetLead, { name: user.displayName }),
      action: { label: copy.resetButton, url },
      footer: copy.resetFooter,
    }),
  })
}

/**
 * Sent after a password is set or changed, so a takeover through a stolen inbox session or a
 * reset link does not go unseen. Its link starts a fresh reset.
 */
export const sendPasswordChangedNotice = async (user: Recipient, locale: Locale): Promise<MailResult> => {
  const copy = copyFor(locale)
  return sendAccountMail('Password changed notice', {
    to: user.email,
    ...render(locale, {
      subject: copy.changedSubject,
      lead: fill(copy.changedLead, { name: user.displayName }),
      action: { label: copy.changedButton, url: pageUrl(locale, ACCOUNT_PATH.forgotPassword) },
      footer: copy.changedFooter,
    }),
  })
}
