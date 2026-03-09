import { useState } from 'react'
import { reviewAssumption } from '../../api/carbonPrice'
import type { CompanyAssumption } from '../../api/carbonPrice'
import { Button } from '../ui/button'
import { Clock, Check, X } from 'lucide-react'
import { formatPeriod } from '../../lib/carbonUtils'

interface Props {
  pending: CompanyAssumption[]
  onReviewSuccess: () => void
}

export default function AdminPanel({ pending, onReviewSuccess }: Props) {
  const [acting, setActing] = useState<number | null>(null)

  const handleReview = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setActing(id)
    try {
      await reviewAssumption(id, action)
      onReviewSuccess()
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-amber-500" />
        <h2 className="text-base font-semibold text-gray-900">Pending Approvals</h2>
        <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {pending.length} pending
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500">Period</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Proposed (€/t)</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Requested By</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Submitted</th>
            <th className="text-right py-2 pl-3 text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {pending.map((a) => (
            <tr key={a.id} className="hover:bg-amber-50/40 transition-colors">
              <td className="py-2.5 pr-4 font-medium text-gray-800">{formatPeriod(a.period)}</td>
              <td className="py-2.5 px-3 text-right font-semibold text-gray-900 tabular-nums">
                €{parseFloat(a.price).toFixed(2)}
              </td>
              <td className="py-2.5 px-3 text-gray-600">{a.requested_by_name}</td>
              <td className="py-2.5 px-3 text-gray-400 text-xs">
                {new Date(a.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: '2-digit',
                })}
              </td>
              <td className="py-2.5 pl-3">
                <div className="flex justify-end gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    disabled={acting === a.id}
                    onClick={() => handleReview(a.id, 'REJECT')}
                  >
                    <X className="w-3 h-3 mr-1" /> Reject
                  </Button>
                  <Button
                    size="xs"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={acting === a.id}
                    onClick={() => handleReview(a.id, 'APPROVE')}
                  >
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
