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
  Banknote,
  Coins,
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
  MessageSquare,
  Sun,
  Moon,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
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
  requiredPermission?: string; // e.g. "properties:read" — omit to allow all roles
}

// ─── Navigation definitions ────────────────────────────────────
const adminItems: SidebarItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, group: "Platform" },
  { label: "Landlords", href: "/admin/landlords", icon: Building2, group: "Platform", requiredPermission: "landlords:read" },
  { label: "Tenants", href: "/admin/tenants", icon: Users, group: "Platform", requiredPermission: "tenants:read" },
  { label: "Properties", href: "/admin/properties", icon: Building, group: "Platform", requiredPermission: "properties:read" },
  { label: "Agreements", href: "/admin/agreements", icon: FileSignature, group: "Platform", requiredPermission: "agreements:read" },
  { label: "Inbox", href: "/messages", icon: MessageSquare, group: "Platform", requiredPermission: "messages:read" },
  { label: "Roles & Staff", href: "/admin/roles", icon: Shield, group: "Management", requiredPermission: "roles:read" },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: Gauge, group: "Billing", requiredPermission: "subscriptions:read" },
  { label: "System Config", href: "/admin/system", icon: Settings, group: "Billing", requiredPermission: "system:read" },
  { label: "Trash Bin", href: "/admin/trash", icon: Trash2, group: "Billing" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, group: "Billing" },
];

const landlordItems: SidebarItem[] = [
  { label: "Overview", href: "/landlord/dashboard", icon: LayoutDashboard, group: "Home" },
  { label: "Properties", href: "/landlord/properties", icon: Building, group: "Assets", requiredPermission: "properties:read" },
  { label: "Floors", href: "/landlord/floors", icon: Layers, group: "Assets", requiredPermission: "properties:read" },
  { label: "Rooms", href: "/landlord/rooms", icon: DoorOpen, group: "Assets", requiredPermission: "properties:read" },
  { label: "Tenants", href: "/landlord/tenants", icon: Users, group: "People", requiredPermission: "tenants:read" },
  { label: "Agreements", href: "/landlord/agreements", icon: FileSignature, group: "People", requiredPermission: "agreements:read" },
  { label: "Inbox", href: "/messages", icon: MessageSquare, group: "People", requiredPermission: "messages:read" },
  { label: "Invoices", href: "/landlord/invoices", icon: FileText, group: "Finance", requiredPermission: "invoices:read" },
  { label: "Payments", href: "/landlord/payments", icon: Banknote, group: "Finance", requiredPermission: "payments:read" },
  { label: "Payouts", href: "/landlord/payouts", icon: Coins, group: "Finance", requiredPermission: "refunds:read" },
  { label: "Utility Bills", href: "/landlord/utilities", icon: Zap, group: "Finance", requiredPermission: "utilities:read" },
  { label: "Support", href: "/landlord/support", icon: LifeBuoy, group: "Other", requiredPermission: "support:read" },
  { label: "Reports", href: "/landlord/reports", icon: BarChart3, group: "Other", requiredPermission: "reports:read" },
  { label: "Roles & Staff", href: "/landlord/roles", icon: Shield, group: "Other", requiredPermission: "roles:read" },
  { label: "Subscriptions", href: "/landlord/subscriptions", icon: Crown, group: "Other", requiredPermission: "subscriptions:read" },
  { label: "Trash Bin", href: "/landlord/trash", icon: Trash2, group: "Other" },
];

const tenantItems: SidebarItem[] = [
  { label: "Dashboard", href: "/tenant", icon: LayoutDashboard, group: "Home" },
  { label: "Inbox", href: "/messages", icon: MessageSquare, group: "Home" },
  { label: "Submit Payment", href: "/tenant/payments/submit", icon: UploadCloud, group: "Finance" },
  { label: "My Invoices", href: "/tenant/invoices", icon: FileText, group: "Finance" },
  { label: "My Agreement", href: "/tenant/agreement", icon: FileSignature, group: "Lease" },
  { label: "Rental History", href: "/tenant/rental-history", icon: Building2, group: "Lease" },
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
  const { modeTheme, setModeTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [unreadMessages, setUnreadMessages] = React.useState(0);

  const fetchNotificationsAndMessages = React.useCallback(async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/messages"),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(notifRes.data.filter((n: any) => !n.is_read).length);

      let msgCount = 0;
      if (user) {
        msgRes.data.forEach((msg: any) => {
          if (msg.sender_id !== user.id && !msg.is_read) {
            if (user.global_role === "SAAS_ADMIN") {
              if (msg.to_admin) msgCount++;
            } else {
              msgCount++;
            }
          }
        });
      }
      setUnreadMessages(msgCount);
    } catch (err) {
      console.error("Failed to fetch notifications or messages", err);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      fetchNotificationsAndMessages();
      const interval = setInterval(fetchNotificationsAndMessages, 15000); // 15 seconds poll
      return () => clearInterval(interval);
    }
  }, [user, fetchNotificationsAndMessages]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotificationsAndMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/notifications");
      fetchNotificationsAndMessages();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  React.useEffect(() => {
    if (initialized && !user) {
      // Redirect to portal-specific login based on current URL or last known role
      const loginPath =
        pathname.startsWith("/admin") ? "/admin/login" :
        pathname.startsWith("/tenant") ? "/tenant/login" :
        pathname.startsWith("/landlord") ? "/landlord/login" :
        // For shared paths like /profile, /messages — use role if available
        "/login";
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
  const allSidebarItems =
    role === "SAAS_ADMIN" ? adminItems :
    role === "TENANT" ? tenantItems : landlordItems;

  // ── Permission-based filtering for STAFF users ─────────────────
  // Full landlords and the principal SAAS_ADMIN (without a staff_profile) see everything.
  // STAFF or SAAS_ADMIN with a staff_profile see only permitted sections.
  const isRestrictedStaff = !!user?.staff_profile;
  const staffPermissions: string[] = (user?.staff_profile?.role?.permissions ?? []).map((p: any) => p.action);

  const hasPermission = (item: SidebarItem): boolean => {
    if (!item.requiredPermission) return true; // no restriction — always visible
    if (!isRestrictedStaff) return true;        // full landlord / root admin
    if (user?.global_role === 'LANDLORD') return true; // full landlord always sees everything
    // Check exact match, wildcard domain (e.g. "properties:*"), or full wildcard
    const [domain] = item.requiredPermission.split(":");
    return staffPermissions.some(
      p => p === item.requiredPermission || p === `${domain}:*` || p === "*:*"
    );
  };

  const sidebarItems = allSidebarItems.filter(hasPermission);

  // ── Access Denied check for direct URL navigation ───────────────
  const currentItem = allSidebarItems.find(
    item => item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/"))
  );
  const canAccessCurrentPage = currentItem ? hasPermission(currentItem) : true;

  // Group items for grouped nav rendering
  const groups = sidebarItems.reduce((acc, item) => {
    const g = item.group || "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const BrandIcon = config.brandIcon;

  const renderSidebarContent = () => (
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
                    {item.label === "Inbox" && unreadMessages > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white flex-shrink-0 leading-none">
                        {unreadMessages}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── User Footer ── */}
      <div className="p-4 border-t flex items-center justify-between gap-3" style={{ borderColor: "var(--portal-sidebar-border)", background: "color-mix(in oklch, var(--portal-sidebar-bg) 90%, black)" }}>
        <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity">
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
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModeTheme(modeTheme === "dark" ? "light" : "dark")}
            title={`Switch to ${modeTheme === "dark" ? "Light" : "Dark"} Mode`}
            style={{ color: "var(--portal-sidebar-muted)" }}
            className="p-1.5 rounded-lg hover:bg-accent/20 transition-colors flex-shrink-0 cursor-pointer"
          >
            {modeTheme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>
          <button
            onClick={logout}
            title="Log Out"
            style={{ color: "var(--portal-sidebar-muted)" }}
            className="p-1.5 rounded-lg hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0 cursor-pointer"
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
        {renderSidebarContent()}
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
                {renderSidebarContent()}
              </SheetContent>
            </Sheet>

            {/* Page title + portal badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-bold" style={{ color: "var(--portal-header-fg, var(--foreground))" }}>
                {allSidebarItems.find(item => item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/")))?.label || "Dashboard"}
              </h1>
              <span className="portal-role-badge hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {config.badgeText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme mode toggle */}
            <button
              onClick={() => setModeTheme(modeTheme === "dark" ? "light" : "dark")}
              title={`Switch to ${modeTheme === "dark" ? "Light" : "Dark"} Mode`}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {modeTheme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </button>

            {/* Notification bell */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 relative cursor-pointer">
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto p-2">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
                  <span className="text-xs font-bold">Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] text-muted-foreground hover:text-destructive font-medium transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border-b border-border/50 last:border-b-0 cursor-pointer ${
                        !n.is_read ? "bg-primary/5 hover:bg-primary/10 font-medium" : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">{n.title}</span>
                        {!n.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-muted-foreground/70 font-mono mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile — clicking the avatar goes directly to /profile */}
            <Link
              href="/profile"
              title="Profile & Settings"
              className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 hover:bg-primary/20 transition-colors text-sm"
            >
              {user?.first_name?.[0] || "U"}
            </Link>
            {/* Logout button */}
            <button
              onClick={logout}
              title="Log out"
              className="h-9 w-9 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-6 md:p-8 transition-colors duration-200">
          <div className="max-w-6xl mx-auto space-y-6">
            {canAccessCurrentPage ? children : (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="h-16 w-16 rounded-sm bg-destructive/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-xl font-black">Access Denied</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your role does not have permission to view this section. Contact your administrator to request access.
                </p>
                <a href=".." className="mt-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-sm hover:opacity-90 transition-all">
                  Go Back
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
