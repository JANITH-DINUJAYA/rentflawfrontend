"use client";

import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
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
  Zap,
  LifeBuoy,
  BarChart3,
  Crown,
  UploadCloud,
  Shield,
  ChevronRight,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  group?: string;
}

// ─── Navigation definitions ────────────────────────────────────
const adminItems: SidebarItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, group: "Platform" },
  { label: "Landlords", href: "/admin/landlords", icon: Building2, group: "Platform" },
  { label: "Tenants", href: "/admin/tenants", icon: Users, group: "Platform" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: Gauge, group: "Billing" },
  { label: "System Config", href: "/admin/system", icon: Settings, group: "Billing" },
];

const landlordItems: SidebarItem[] = [
  { label: "Overview", href: "/landlord/dashboard", icon: LayoutDashboard, group: "Home" },
  { label: "Properties", href: "/landlord/properties", icon: Building, group: "Assets" },
  { label: "Floors", href: "/landlord/floors", icon: Layers, group: "Assets" },
  { label: "Rooms", href: "/landlord/rooms", icon: DoorOpen, group: "Assets" },
  { label: "Tenants", href: "/landlord/tenants", icon: Users, group: "People" },
  { label: "Agreements", href: "/landlord/agreements", icon: FileSignature, group: "People" },
  { label: "Invoices", href: "/landlord/invoices", icon: FileText, group: "Finance" },
  { label: "Payments", href: "/landlord/payments", icon: DollarSign, group: "Finance" },
  { label: "Utility Bills", href: "/landlord/utilities", icon: Zap, group: "Finance" },
  { label: "Support", href: "/landlord/support", icon: LifeBuoy, group: "Other" },
  { label: "Reports", href: "/landlord/reports", icon: BarChart3, group: "Other" },
  { label: "Subscriptions", href: "/landlord/subscriptions", icon: Crown, group: "Other" },
];

const tenantItems: SidebarItem[] = [
  { label: "Dashboard", href: "/tenant", icon: LayoutDashboard, group: "Home" },
  { label: "Submit Payment", href: "/tenant/payments/submit", icon: UploadCloud, group: "Finance" },
  { label: "My Invoices", href: "/tenant/invoices", icon: FileText, group: "Finance" },
  { label: "My Agreement", href: "/tenant/agreement", icon: FileSignature, group: "Lease" },
  { label: "Support", href: "/tenant/support", icon: HelpCircle, group: "Lease" },
];

// ─── Portal config per role ─────────────────────────────────────
const portalConfig = {
  SAAS_ADMIN: {
    portalClass: "portal-admin",
    label: "Admin Console",
    badgeText: "SUPER ADMIN",
    brandIcon: Shield,
    brandName: "RentFlaw",
    brandSub: "Admin",
    headerTitle: "System Administration",
  },
  LANDLORD: {
    portalClass: "portal-landlord",
    label: "Landlord Portal",
    badgeText: "LANDLORD",
    brandIcon: Building2,
    brandName: "RentFlaw",
    brandSub: "Pro",
    headerTitle: "Property Management",
  },
  TENANT: {
    portalClass: "portal-tenant",
    label: "Tenant Portal",
    badgeText: "TENANT",
    brandIcon: User,
    brandName: "RentFlaw",
    brandSub: "Home",
    headerTitle: "My Home",
  },
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, checkAuth, initialized } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  React.useEffect(() => {
    if (initialized && !user) {
      // Redirect to portal-specific login based on current URL
      const loginPath =
        pathname.startsWith("/admin") ? "/admin/login" :
        pathname.startsWith("/tenant") ? "/tenant/login" :
        "/landlord/login";
      router.push(loginPath);
    }
  }, [initialized, user, router, pathname]);

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

  // Detect portal from URL path first — this works before auth is connected
  const portalRole: keyof typeof portalConfig =
    pathname.startsWith("/admin") ? "SAAS_ADMIN" :
    pathname.startsWith("/tenant") ? "TENANT" :
    (user?.global_role as keyof typeof portalConfig) || "LANDLORD";

  const role = portalRole;
  const config = portalConfig[role] || portalConfig.LANDLORD;
  const sidebarItems =
    role === "SAAS_ADMIN" ? adminItems :
    role === "TENANT" ? tenantItems : landlordItems;

  // Group items for grouped nav rendering
  const groups = sidebarItems.reduce((acc, item) => {
    const g = item.group || "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const BrandIcon = config.brandIcon;

  const SidebarContent = () => (
    <div className="portal-sidebar flex flex-col h-full transition-colors duration-200">
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-5 h-[64px] border-b"
           style={{ borderColor: "var(--portal-sidebar-border)" }}>
        <div className="portal-sidebar-logo h-9 w-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
          <BrandIcon className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-extrabold text-[15px] tracking-tight" style={{ color: "var(--portal-sidebar-fg)" }}>
            {config.brandName}
            <span className="ml-1 text-[11px] font-bold opacity-60">{config.brandSub}</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--portal-sidebar-muted)" }}>
            {config.label}
          </span>
        </div>
      </div>

      {/* ── Role Badge (Admin only — makes it unmistakable) ── */}
      {role === "SAAS_ADMIN" && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-xl flex items-center gap-2"
             style={{ background: "var(--portal-sidebar-active-bg)", color: "var(--portal-sidebar-active-fg)" }}>
          <Activity className="h-3.5 w-3.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Super Admin Mode</p>
            <p className="text-xs font-semibold">Full platform access</p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5"
               style={{ color: "var(--portal-sidebar-muted)", opacity: 0.7 }}>
              {groupName}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`portal-sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? "active" : ""}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── User Footer ── */}
      <div className="p-4 border-t" style={{ borderColor: "var(--portal-sidebar-border)", background: "color-mix(in oklch, var(--portal-sidebar-bg) 90%, black)" }}>
        <div className="flex items-center gap-3">
          <div className="portal-sidebar-logo h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user?.first_name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: "var(--portal-sidebar-fg)" }}>
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[10px] truncate" style={{ color: "var(--portal-sidebar-muted)" }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            style={{ color: "var(--portal-sidebar-muted)" }}
            className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${config.portalClass} flex min-h-screen bg-background`}>
      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="portal-header sticky top-0 z-20 w-full h-16 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="lg:hidden p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Page title + portal badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold text-foreground">
                {sidebarItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"))?.label || "Dashboard"}
              </h1>
              <span className="portal-role-badge hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {config.badgeText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 hover:bg-primary/20 transition-colors text-sm">
                {user?.first_name?.[0] || "U"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{config.label}</p>
                </DropdownMenuLabel>
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
