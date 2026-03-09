import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { MarketDataPoint, CompanyAssumption } from '../../api/carbonPrice'
import { periodToMonthKey } from '../../lib/carbonUtils'

interface Props {
  marketData: MarketDataPoint[]
  activeAssumptions: CompanyAssumption[]
  draftPrices: Record<string, string>
  onSelectForecast: (source: string) => void
}

type ChartPoint = {
  date: string
  historical?: number
  analyst_bnef?: number
  analyst_refinitiv?: number
  analyst_internal?: number
  company_active?: number
  company_draft?: number
}

const SOURCE_CONFIG = {
  historical:        { label: 'Historical',        color: '#94a3b8', dash: '',    width: 1.5 },
  analyst_bnef:      { label: 'BNEF',              color: '#8b5cf6', dash: '5 4', width: 1.5 },
  analyst_refinitiv: { label: 'Refinitiv',         color: '#3b82f6', dash: '5 4', width: 1.5 },
  analyst_internal:  { label: 'Internal',          color: '#f59e0b', dash: '5 4', width: 1.5 },
  company_active:    { label: 'Active Assumption', color: '#f97316', dash: '',    width: 2.5 },
  company_draft:     { label: 'Current Draft',     color: '#f97316', dash: '3 3', width: 2   },
} as const

type SourceKey = keyof typeof SOURCE_CONFIG
const ANALYST_SOURCES: SourceKey[] = ['analyst_bnef', 'analyst_refinitiv', 'analyst_internal']

function buildChartData(
  market: MarketDataPoint[],
  active: CompanyAssumption[],
  draft: Record<string, string>
): ChartPoint[] {
  const map = new Map<string, ChartPoint>()

  // Historical → monthly average
  const hist = new Map<string, { sum: number; count: number }>()
  market
    .filter((d) => d.source === 'historical')
    .forEach((d) => {
      const key = d.date.substring(0, 7)
      const b = hist.get(key) ?? { sum: 0, count: 0 }
      b.sum += parseFloat(d.price)
      b.count++
      hist.set(key, b)
    })
  hist.forEach((b, key) => {
    map.set(key, { date: key, historical: Math.round((b.sum / b.count) * 100) / 100 })
  })

  // Analyst forecasts (quarterly)
  market
    .filter((d) => ANALYST_SOURCES.includes(d.source as SourceKey))
    .forEach((d) => {
      const key = d.date.substring(0, 7)
      const p = map.get(key) ?? { date: key }
      ;(p as Record<string, unknown>)[d.source] = parseFloat(d.price)
      map.set(key, p)
    })

  // Active company assumption
  active.forEach((a) => {
    const key = periodToMonthKey(a.period)
    const p = map.get(key) ?? { date: key }
    p.company_active = parseFloat(a.price)
    map.set(key, p)
  })

  // Draft (live preview while editing)
  Object.entries(draft).forEach(([period, price]) => {
    if (!price) return
    const key = periodToMonthKey(period)
    const p = map.get(key) ?? { date: key }
    p.company_draft = parseFloat(price)
    map.set(key, p)
  })

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
}

const TODAY = new Date().toISOString().substring(0, 7)

function LegendItem({
  sourceKey,
  onSelectForecast,
}: {
  sourceKey: SourceKey
  onSelectForecast: (s: string) => void
}) {
  const { label, color, dash, width } = SOURCE_CONFIG[sourceKey]
  const isAnalyst = ANALYST_SOURCES.includes(sourceKey)
  return (
    <button
      onClick={() => isAnalyst && onSelectForecast(sourceKey)}
      className={`flex items-center gap-1.5 text-xs ${
        isAnalyst ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'
      }`}
      title={isAnalyst ? `Click to fill table with ${label} values` : undefined}
    >
      <svg width="24" height="10" aria-hidden>
        <line
          x1="0" y1="5" x2="24" y2="5"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={dash}
        />
      </svg>
      <span style={{ color }}>{label}</span>
    </button>
  )
}

export default function ForecastChart({
  marketData, activeAssumptions, draftPrices, onSelectForecast,
}: Props) {
  const data = buildChartData(marketData, activeAssumptions, draftPrices)

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">EUA Price Forecast</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Historical data + analyst forecasts. Click an analyst in the legend to auto-fill the table below.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-end pt-1">
          {(Object.keys(SOURCE_CONFIG) as SourceKey[]).map((key) => (
            <LegendItem key={key} sourceKey={key} onSelectForecast={onSelectForecast} />
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(v: string) => {
              const [year, month] = v.split('-')
              return month === '01' ? year : ''
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(v: number) => `€${v}`}
            domain={['auto', 'auto']}
            width={52}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `€${Number(value).toFixed(2)}`,
              SOURCE_CONFIG[name as SourceKey]?.label ?? name,
            ]}
            labelFormatter={(label) => `Period: ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <ReferenceLine
            x={TODAY}
            stroke="#d1d5db"
            strokeWidth={2}
            label={{ value: 'Today', fill: '#9ca3af', fontSize: 10, position: 'insideTopRight' }}
          />
          {(Object.keys(SOURCE_CONFIG) as SourceKey[]).map((key) => {
            const { color, dash, width } = SOURCE_CONFIG[key]
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={width}
                strokeDasharray={dash || undefined}
                dot={false}
                connectNulls
                legendType="none"
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
