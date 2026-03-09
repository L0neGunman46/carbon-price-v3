import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ForecastChart from "../components/carbon/ForecastChart";
import AssumptionTable from "../components/carbon/AssumptionTable";
import AdminPanel from "../components/carbon/AdminPanel";
import AuditLogDrawer from "../components/carbon/AuditLogDrawer";
import { getMarketData, getAssumptions } from "../api/carbonPrice";
import type { MarketDataPoint, CompanyAssumption } from "../api/carbonPrice";
import { PERIODS, getAnalystPriceForPeriod } from "../lib/carbonUtils";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CarbonPricePage() {
  const { isAdmin } = useAuth();
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [activeAssumptions, setActiveAssumptions] = useState<
    CompanyAssumption[]
  >([]);
  const [pendingAssumptions, setPendingAssumptions] = useState<
    CompanyAssumption[]
  >([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // State to control the popup visibility
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  const loadData = async () => {
    try {
      const [marketRes, assumptionsRes] = await Promise.all([
        getMarketData(),
        getAssumptions(),
      ]);
      setMarketData(marketRes.data);
      setActiveAssumptions(assumptionsRes.data.active);
      setPendingAssumptions(assumptionsRes.data.pending);
      // Pre-fill drafts from currently active assumptions
      const initial: Record<string, string> = {};
      for (const a of assumptionsRes.data.active) {
        initial[a.period] = a.price;
      }
      setDraftPrices(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectForecast = (source: string) => {
    const newPrices: Record<string, string> = {};
    for (const period of PERIODS) {
      const price = getAnalystPriceForPeriod(marketData, source, period);
      if (price !== null) newPrices[period] = price.toFixed(2);
    }
    setDraftPrices(newPrices);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-8 text-sm text-gray-400">
        Loading carbon price data...
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Fixed Navbar-style Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <div className="flex">
            <h1 className="text-2xl font-bold text-gray-900 mr-4">
              Carbon Price
            </h1>
            {/* Relative wrapper for the popover positioning  */}
            <div className="relative">
              <button
                onClick={() => setIsLearnMoreOpen(!isLearnMoreOpen)}
                className="flex items-center gap-1 rounded-md bg-[#edebef] px-3 py-1 text-md font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Learn more
                {isLearnMoreOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {/* Popover Content */}
              {isLearnMoreOpen && (
                <>
                  {/* Invisible overlay to catch clicks outside the popover */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsLearnMoreOpen(false)}
                  />

                  {/* The actual popover box */}
                  <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900">
                        What is Carbon Price?
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        The Carbon Price (often referred to as the EUA price)
                        represents the cost of emitting one tonne of CO₂
                        equivalent under the EU Emissions Trading System (ETS).
                      </p>
                      <p>
                        Under CBAM, importers must purchase certificates
                        corresponding to the embedded emissions in their
                        imported goods.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-sm text-gray-500">
              Set your company's EUA price assumptions for CBAM cost
              calculations.
            </p>
          </div>
        </div>
        <AuditLogDrawer />
      </div>

      {/* Scrollable Page Content */}
      <div className="space-y-5 p-6">
        {/* Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <ForecastChart
            marketData={marketData}
            activeAssumptions={activeAssumptions}
            draftPrices={draftPrices}
            onSelectForecast={handleSelectForecast}
          />
        </div>

        {/* Assumption table */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
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
          <div className="rounded-xl border border-amber-200 bg-white p-5">
            <AdminPanel
              pending={pendingAssumptions}
              onReviewSuccess={loadData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
