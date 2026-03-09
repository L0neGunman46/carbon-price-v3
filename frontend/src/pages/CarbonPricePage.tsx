import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ForecastChart from '../components/carbon/ForecastChart'
import AssumptionTable from '../components/carbon/AssumptionTable'
import AdminPanel from '../components/carbon/AdminPanel'
import AuditLogDrawer from '../components/carbon/AuditLogDrawer'
import { getMarketData, getAssumptions } from '../api/carbonPrice'
import type { MarketDataPoint, CompanyAssumption } from '../api/carbonPrice'
import { PERIODS, getAnalystPriceForPeriod } from '../lib/carbonUtils'

export default function CarbonPricePage() {
  const { isAdmin } = useAuth()
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([])
  const [activeAssumptions, setActiveAssumptions] = useState<CompanyAssumption[]>([])
  const [pendingAssumptions, setPendingAssumptions] = useState<CompanyAssumption[]>([])
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [marketRes, assumptionsRes] = await Promise.all([
        getMarketData(),
        getAssumptions(),
      ])
      setMarketData(marketRes.data)
      setActiveAssumptions(assumptionsRes.data.active)
      setPendingAssumptions(assumptionsRes.data.pending)
      // Pre-fill drafts from currently active assumptions
      const initial: Record<string, string> = {}
      for (const a of assumptionsRes.data.active) {
        initial[a.period] = a.price
      }
      setDraftPrices(initial)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleSelectForecast = (source: string) => {
    const newPrices: Record<string, string> = {}
    for (const period of PERIODS) {
      const price = getAnalystPriceForPeriod(marketData, source, period)
      if (price !== null) newPrices[period] = price.toFixed(2)
    }
    setDraftPrices(newPrices)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading carbon price data...
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Carbon Price</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set your company's EUA price assumptions for CBAM cost calculations.
          </p>
        </div>
        <AuditLogDrawer />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ForecastChart
          marketData={marketData}
          activeAssumptions={activeAssumptions}
          draftPrices={draftPrices}
          onSelectForecast={handleSelectForecast}
        />
      </div>

      {/* Assumption table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <AssumptionTable
          marketData={marketData}
          draftPrices={draftPrices}
          onPriceChange={(period, price) =>
            setDraftPrices((prev) => ({ ...prev, [period]: price }))
          }
          onSubmitSuccess={loadData}
        />
      </div>

      {/* Admin pending approvals — only shown to admins when there are items */}
      {isAdmin && pendingAssumptions.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <AdminPanel pending={pendingAssumptions} onReviewSuccess={loadData} />
        </div>
      )}
    </div>
  )
}
