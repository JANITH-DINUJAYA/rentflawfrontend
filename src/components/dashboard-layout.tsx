"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { useTheme } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Building2,
  LayoutDashboard,
  Building,
  Layers,
  DoorOpen,
  Users,
  FileSignature,
  FileText,
  DollarSign,
  Gauge,
  HelpCircle,
  LogOut,
  User,
  Settings,
  Bell,
  Menu,
  ChevronDown,
  Zap,
  LifeBuoy,
  BarChart3,
  Crown,
  UploadCloud
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, checkAuth, initialized } = useAuthStore();
  const { colorTheme, modeTheme } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fallback loading state
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Get active role
  const role = user?.global_role || "LANDLORD"; // default to landlord for demo

  // Configure navigation based on role
  const adminItems: SidebarItem[] = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Landlords", href: "/admin/landlords", icon: Building2 },
    { label: "Tenants", href: "/admin/tenants", icon: Users },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: Gauge },
    { label: "System Config", href: "/admin/system", icon: Settings },
  ];

  const landlordItems: SidebarItem[] = [
    { label: "Overview", href: "/landlord/dashboard", icon: LayoutDashboard },
    { label: "Properties", href: "/landlord/properties", icon: Building },
    { label: "Floors", href: "/landlord/floors", icon: Layers },
    { label: "Rooms", href: "/landlord/rooms", icon: DoorOpen },
    { label: "Tenants", href: "/landlord/tenants", icon: Users },
    { label: "Agreements", href: "/landlord/agreements", icon: FileSignature },
    { label: "Invoices", href: "/landlord/invoices", icon: FileText },
    { label: "Payments", href: "/landlord/payments", icon: DollarSign },
    { label: "Utility Bills", href: "/landlord/utilities", icon: Zap },
    { label: "Support Tickets", href: "/landlord/support", icon: LifeBuoy },
    { label: "Reports", href: "/landlord/reports", icon: BarChart3 },
    { label: "Subscriptions", href: "/landlord/subscriptions", icon: Crown },
  ];

  const tenantItems: SidebarItem[] = [
    { label: "Dashboard", href: "/tenant", icon: LayoutDashboard },
    { label: "Submit Payment", href: "/tenant/payments/submit", icon: UploadCloud },
    { label: "Invoices", href: "/tenant/invoices", icon: FileText },
    { label: "My Agreement", href: "/tenant/agreement", icon: FileSignature },
    { label: "Support Tickets", href: "/tenant/support", icon: HelpCircle },
  ];

  const sidebarItems = 
    role === "SAAS_ADMIN" ? adminItems :
    role === "TENANT" ? tenantItems : landlordItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border transition-colors duration-200">
      {/* Brand logo */}
      <div className="flex items-center space-x-3 px-6 h-16 border-b border-border">
        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          Rent<span className="text-primary">Flaw</span>
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
          Navigation ({role.replace("_", " ")})
        </p>
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Footer info */}
      <div className="p-4 border-t border-border bg-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
              {user?.first_name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── Sidebar (Desktop) ─────────────────────── */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ─── Main Content Area ──────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="sticky top-0 z-20 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-6 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle for mobile */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Context title */}
            <h1 className="text-md font-bold text-foreground">
              {sidebarItems.find(item => pathname === item.href)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Alerts notification */}
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>

            {/* Color Palette Switcher Trigger (Popover Panel) */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200">
                <span className="h-3 w-3 rounded-full bg-primary" />
                <span className="capitalize hidden sm:inline">{colorTheme} Theme</span>
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0 border border-border bg-card">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mini Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
                {user?.first_name?.[0] || "U"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" /> Profile Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 transition-colors duration-200">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
