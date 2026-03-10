import { Outlet, NavLink, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Package,
  LogOut,
  ChevronDown,
  Bell,
  Building2,
  Earth,
  Layers,
  Ship,
  ChartNoAxesCombined,
  ChevronsUpDownIcon,
  BanknoteArrowDown,
  ReceiptText,
  FileChartColumnIncreasing,
  Ellipsis,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "../ui/button";

const NAV_ITEMS = [
  { label: "Home", icon: Home, path: "/", disabled: true },
  {
    label: "Product Catalogue",
    icon: Package,
    path: "/products",
    disabled: true,
  },
  { label: "Suppliers", icon: Earth, path: "/suppliers", disabled: true },
  {
    label: "Purchase Orders",
    icon: Layers,
    path: "/purchase-orders",
    disabled: true,
  },
  { label: "Shipments", icon: Ship, path: "/shipments", disabled: true },
  {
    label: "Carbon Price",
    icon: ChartNoAxesCombined,
    path: "/carbon-price",
    disabled: false,
  },
];

const AppSection = [
  { label: "Purchasing", icon: BanknoteArrowDown },
  { label: "Sales", icon: ReceiptText },
  { label: "Financial", icon: FileChartColumnIncreasing },
  { label: "More", icon: Ellipsis },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className="w-70 flex flex-col shrink-0 overflow-y-auto"
        style={{ backgroundColor: "#250d2e" }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-3 flex justify-center">
          <span className="text-[#f6a57e] text-3xl font-bold tracking-wide">
            CBAMBOO
          </span>
        </div>

        {/* Company pill */}
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-[#453350] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#230c2a] flex items-center justify-center text-white text-xs font-bold">
              <Building2 className="w-4 h-4 " />
            </div>
            <div>
              <p className="text-[#fff9ff] text-xs font-semibold leading-tight">
                {user?.company_name}
              </p>
              <p className="text-[#fff9ff] text-xs">Hamburg, Germany</p>
            </div>
          </div>
          <ChevronsUpDownIcon className="w-4 h-4 text-[#fff9ff]" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(({ label, icon: Icon, path, disabled }) =>
            disabled ? (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-[#fff9ff] text-sm"
              >
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ) : (
              <NavLink
                key={label}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border-2 border-transparenttransition-colors ${
                    isActive
                      ? "bg-[#ffa574] text-[#270117] font-medium border-[#6d1d8e]"
                      : "text-[#fff9ff hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ),
          )}

          {/* Apps section */}
          <div className="pt-3 pb-1">
            <p className="text-[#fff9ff] text-xs px-3 tracking-wider mb-1">
              Apps
            </p>
          </div>
          {AppSection.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center justify-between px-3 py-2.5 rounded-md text-[#fff9ff] text-sm"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {label}
              </div>
              <ChevronDown className="w-4 h-4" />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-[#fff9ff] text-sm hover:bg-white/10 text-left">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-[#fff9ff] text-sm hover:bg-white/10 text-left">
            <MessageSquarePlus className="w-4 h-4" /> Send Feedback
          </button>
          <div className="flex items-center justify-between px-3 py-2 bg-[#453350] rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ffa574] flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="text-white text-xs font-medium leading-tight">
                  {user?.username}
                </p>
                <p className="text-white/40 text-xs capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              title="Logout!"
              className="text-white/40 hover:text-white hover:bg-white/10 cursor-pointer"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
