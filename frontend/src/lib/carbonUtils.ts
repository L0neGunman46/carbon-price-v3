import type { MarketDataPoint } from '../api/carbonPrice'

const _currentYear = new Date().getFullYear()
export const PREV_YEAR_PERIOD = String(_currentYear - 1)
export const CURRENT_YEAR = _currentYear

export const PERIODS = [
  PREV_YEAR_PERIOD,
  `${_currentYear}-Q1`, `${_currentYear}-Q2`, `${_currentYear}-Q3`, `${_currentYear}-Q4`,
  ...Array.from({ length: 10 }, (_, i) => String(_currentYear + 1 + i)),
]

const PERIOD_LABELS: Record<string, string> = {
  [`${_currentYear}-Q1`]: `Q1 ${_currentYear}`,
  [`${_currentYear}-Q2`]: `Q2 ${_currentYear}`,
  [`${_currentYear}-Q3`]: `Q3 ${_currentYear}`,
  [`${_currentYear}-Q4`]: `Q4 ${_currentYear}`,
}

export function formatPeriod(period: string) {
  return PERIOD_LABELS[period] ?? period
}

export function periodToMonthKey(period: string): string {
  if (period.includes('-Q')) {
    const [year, q] = period.split('-Q')
    const month = (parseInt(q) - 1) * 3 + 1
    return `${year}-${String(month).padStart(2, '0')}`
  }
  return `${period}-01`
}

export function getAnalystPriceForPeriod(
  market: MarketDataPoint[],
  analyst: string,
  period: string
): number | null {
  const target = new Date(periodToMonthKey(period) + '-01').getTime()
  const points = market.filter((d) => d.source === analyst)
  if (points.length === 0) return null

  let closest = points[0]
  let minDiff = Math.abs(new Date(closest.date).getTime() - target)
  for (const p of points) {
    const diff = Math.abs(new Date(p.date).getTime() - target)
    if (diff < minDiff) { minDiff = diff; closest = p }
  }
  return parseFloat(closest.price)
}
