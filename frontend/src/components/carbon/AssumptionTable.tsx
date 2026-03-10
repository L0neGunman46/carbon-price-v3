import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { submitAssumptions } from "../../api/carbonPrice";
import type { MarketDataPoint } from "../../api/carbonPrice";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  PERIODS,
  PREV_YEAR_PERIOD,
  formatPeriod,
  getAnalystPriceForPeriod,
} from "../../lib/carbonUtils";
import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  marketData: MarketDataPoint[];
  draftPrices: Record<string, string>;
  onPriceChange: (period: string, price: string) => void;
  onSubmitSuccess: () => void;
}

const ANALYSTS = [
  { key: "analyst_bnef", label: "BNEF" },
  { key: "analyst_refinitiv", label: "Refinitiv" },
  { key: "analyst_internal", label: "Internal" },
];

export default function AssumptionTable({
  marketData,
  draftPrices,
  onPriceChange,
  onSubmitSuccess,
}: Props) {
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const fillFrom = (analystKey: string) => {
    for (const period of PERIODS) {
      if (period === PREV_YEAR_PERIOD) continue;
      const price = getAnalystPriceForPeriod(marketData, analystKey, period);
      if (price !== null) onPriceChange(period, price.toFixed(2));
    }
  };

  const handleSubmit = async () => {
    const payload = PERIODS.filter(
      (p) =>
        p !== PREV_YEAR_PERIOD &&
        draftPrices[p] &&
        !isNaN(parseFloat(draftPrices[p])),
    ).map((p) => ({ period: p, price: parseFloat(draftPrices[p]) }));

    if (payload.length === 0) {
      setToast({ ok: false, msg: "Enter at least one price." });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await submitAssumptions(payload);
      setToast({
        ok: true,
        msg: isAdmin
          ? `${payload.length} prices saved and activated.`
          : `${payload.length} prices submitted for approval.`,
      });
      onSubmitSuccess();
    } catch {
      setToast({ ok: false, msg: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Your Price Assumptions
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Enter a price per period, or auto-fill from an analyst forecast.
          </p>
        </div>
        <div className="flex gap-2">
          {ANALYSTS.map(({ key, label }) => (
            <Button
              key={key}
              title="Click Me!"
              variant="outline"
              size="xs"
              onClick={() => fillFrom(key)}
              className="bg-[#edebef] cursor-pointer"
            >
              Use {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2.5 pr-4 text-md font-medium text-[#181d1f] w-28">
                Period
              </th>
              {ANALYSTS.map(({ label }) => (
                <th
                  key={label}
                  className="text-right py-2.5 px-3 text-md font-medium text-[#181d1f] w-28"
                >
                  {label} (€/t)
                </th>
              ))}
              <th className="text-right py-2.5 pl-3 text-md font-semibold text-[#181d1f] w-36">
                Your Price (€/t)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PERIODS.map((period) => {
              const isPrevYear = period === PREV_YEAR_PERIOD;
              const analystPrices = ANALYSTS.map(({ key }) =>
                getAnalystPriceForPeriod(marketData, key, period),
              );
              return (
                <tr
                  key={period}
                  className={`transition-colors ${isPrevYear ? "bg-gray-50 text-gray-400" : "hover:bg-[#edebef]"}`}
                >
                  <td className="py-2 pr-4 font-medium text-gray-800">
                    <span>{formatPeriod(period)}</span>
                    {isPrevYear && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        (historical)
                      </span>
                    )}
                  </td>
                  {analystPrices.map((price, i) => (
                    <td
                      key={ANALYSTS[i].key}
                      className="py-2 px-3 text-right text-[#181d1f] tabular-nums"
                    >
                      {price !== null ? `€${price.toFixed(2)}` : "—"}
                    </td>
                  ))}
                  <td className="py-2 pl-3">
                    <div className="flex justify-end">
                      {isPrevYear ? (
                        <span className="w-28 text-right text-sm text-gray-500 tabular-nums pr-1">
                          {draftPrices[period]
                            ? `€${parseFloat(draftPrices[period]).toFixed(2)}`
                            : "—"}
                        </span>
                      ) : (
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#181d1f] text-md pointer-events-none">
                            €
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draftPrices[period] ?? ""}
                            onChange={(e) =>
                              onPriceChange(period, e.target.value)
                            }
                            className="pl-6 text-right text-sm h-8 hover:border-2 hover:border-purple-600"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          {isAdmin ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Saves
              activate immediately (Admin)
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Changes require
              admin approval
            </>
          )}
        </span>
        <div className="flex items-center gap-3">
          {toast && (
            <span
              className={`text-sm ${toast.ok ? "text-green-600" : "text-red-500"}`}
            >
              {toast.msg}
            </span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#ffa574] hover:bg-[#ffa574] hover:border-2  hover:border-[#6d1d8e] text-[#270117] cursor-pointer"
          >
            {submitting
              ? "Saving..."
              : isAdmin
                ? "Save & Activate"
                : "Submit for Approval"}
          </Button>
        </div>
      </div>
    </div>
  );
}
