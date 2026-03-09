import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { getAuditLogs } from "../../api/carbonPrice";
import type { AuditLog } from "../../api/carbonPrice";
import { ClipboardList } from "lucide-react";

const ACTION_STYLE: Record<string, string> = {
  SUBMITTED_DRAFT: "bg-blue-100 text-blue-700",
  SAVED_ACTIVE: "bg-green-100 text-green-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const ACTION_LABEL: Record<string, string> = {
  SUBMITTED_DRAFT: "Submitted",
  SAVED_ACTIVE: "Saved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function AuditLogDrawer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const handleOpen = async (open: boolean) => {
    if (!open) return;
    setLoading(true);
    try {
      const res = await getAuditLogs();
      setLogs(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 hover:bg-[#eee7f3]/50 border-2 border-[#6d1d8e]" size={"lg"}>
          <div className="bg-[#e0d0e6] text-[#6d1d8e] p-1.5 rounded">
            <ClipboardList className="w-4 h-4" />
          </div>
          <span>Audit Log</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[460px] sm:max-w-[460px] flex flex-col h-full">
        <SheetHeader className="shrink-0 pb-2 border-b border-gray-100 bg-[#eee7f3]">
          <SheetTitle className="font-bold text-lg">Audit Log</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto mt-2 pr-2 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Loading...
            </p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No activity yet.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-gray-50 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {log.username}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      ACTION_STYLE[log.action] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{log.details}</p>
                <p className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
