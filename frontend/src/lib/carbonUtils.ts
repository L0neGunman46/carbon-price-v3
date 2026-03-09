import type { MarketDataPoint } from '../api/carbonPrice'

export const PERIODS = [
  '2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4',
  '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035',
]

const PERIOD_LABELS: Record<string, string> = {
  '2026-Q1': 'Q1 2026', '2026-Q2': 'Q2 2026',
  '2026-Q3': 'Q3 2026', '2026-Q4': 'Q4 2026',
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
