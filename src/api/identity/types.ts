import { Endpoint } from '@interfaces/api'
import { HealthStatus, SessionUser } from '@interfaces/entities'

export type GetHealthAPI = Endpoint<{ payload: void; response: HealthStatus; processed: HealthStatus }>

/** `null` for a guest. */
export type GetMeAPI = Endpoint<{ payload: void; response: SessionUser | null; processed: SessionUser | null }>

export type LogoutAPI = Endpoint<{ payload: void; response: boolean; processed: boolean }>
