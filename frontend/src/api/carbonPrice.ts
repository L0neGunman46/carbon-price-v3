import { api } from './client'

export interface User {
  username: string
  role: 'ADMIN' | 'MEMBER'
  company_name: string
}

export interface MarketDataPoint {
  source: string
  date: string // YYYY-MM-DD
  price: string
}

export interface CompanyAssumption {
  id: number
  period: string
  price: string
  status: 'PENDING' | 'ACTIVE'
  requested_by_name: string
  approved_by_name: string | null
  created_at: string
}

export interface AssumptionsResponse {
  active: CompanyAssumption[]
  pending: CompanyAssumption[]
}

export interface AuditLog {
  id: number
  username: string
  action: string
  details: string
  timestamp: string
}

export const getMe = () =>
  api.get<User>('/carbon-price/users/me/')

export const getMarketData = () =>
  api.get<MarketDataPoint[]>('/carbon-price/market-data/')

export const getAssumptions = () =>
  api.get<AssumptionsResponse>('/carbon-price/assumptions/')

export const submitAssumptions = (data: { period: string; price: number }[]) =>
  api.post('/carbon-price/assumptions/', data)

export const reviewAssumption = (id: number, action: 'APPROVE' | 'REJECT') =>
  api.post(`/carbon-price/assumptions/${id}/review/`, { action })

export const getAuditLogs = () =>
  api.get<AuditLog[]>('/carbon-price/audit-logs/')
