import type { OAuthFlowContext } from '../lib/oauth-state.js'
import type { SessionPayload } from '../lib/session.js'

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload
      /** Set by `oauthStateStore.verify` once the callback's nonce matched. */
      oauthFlow?: OAuthFlowContext
    }
  }
}

export {}
