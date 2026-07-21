"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useTheme, ColorTheme } from "@/components/theme-provider";
import { Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { User, KeyRound, Check, AlertCircle, Copy, Landmark } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Profile fields state
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [profileSuccess, setProfileSuccess] = React.useState("");
  const [profileError, setProfileError] = React.useState("");
  const [profilePending, setProfilePending] = React.useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [passwordPending, setPasswordPending] = React.useState(false);

  // Landlord bank details states
  const [bankName, setBankName] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [branchName, setBranchName] = React.useState("");
  const [swiftCode, setSwiftCode] = React.useState("");
  const [bankSuccess, setBankSuccess] = React.useState("");
  const [bankError, setBankError] = React.useState("");
  const [bankPending, setBankPending] = React.useState(false);

  const [copied, setCopied] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
      setFirstName(res.data.first_name || "");
      setLastName(res.data.last_name || "");
      setPhone(res.data.phone || "");

      const lp = res.data.landlord_profile;
      if (lp) {
        setBankName(lp.bank_name || "");
        setAccountName(lp.account_name || "");
        setAccountNumber(lp.account_number || "");
        setBranchName(lp.branch_name || "");
        setSwiftCode(lp.swift_code || "");
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");
    setProfilePending(true);

    try {
      await api.patch("/users/profile", {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setProfileSuccess("Profile updated successfully!");
      fetchProfile();
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setProfilePending(false);
    }
  };

  const handleUpdateBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSuccess("");
    setBankError("");
    setBankPending(true);

    try {
      await api.patch("/landlords/profile", {
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        branch_name: branchName,
        swift_code: swiftCode,
      });
      setBankSuccess("Bank details updated successfully!");
      fetchProfile();
    } catch (err: any) {
      setBankError(err.response?.data?.message || "Failed to update bank details");
    } finally {
      setBankPending(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordPending(true);

    try {
      await api.patch("/users/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordPending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Details</h2>
          <p className="text-sm text-muted-foreground">Manage your account information and security settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary / Role Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border border-border shadow-md">
              <div className="h-24 bg-gradient-to-r from-primary/30 to-violet-500/20" />
              <CardContent className="relative pt-12 pb-6 px-6 text-center">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-20 w-20 rounded-2xl bg-background border-4 border-card flex items-center justify-center font-extrabold text-2xl shadow-lg text-primary">
                  {profile?.first_name?.[0] || "U"}
                </div>
                <h3 className="text-lg font-extrabold">{profile?.first_name} {profile?.last_name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{profile?.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider">
                  {profile?.global_role}
                </div>

                {profile?.landlord_profile && (
                  <div className="mt-4 pt-4 border-t border-border text-left space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Company Name</p>
                    <p className="text-sm font-bold">{profile.landlord_profile.company_name || "N/A"}</p>
                  </div>
                )}

                {profile?.tenant_code && (
                  <div className="mt-4 pt-4 border-t border-border text-left space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Tenant Share Code</p>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-accent/40 border border-border">
                      <span className="text-xs font-mono font-bold tracking-wider">{profile.tenant_code}</span>
                      <button
                        onClick={() => copyToClipboard(profile.tenant_code)}
                        className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                        title="Copy code"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Share this code with your landlord to link your lease agreement.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Personal Info */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription>Update your name, contact details, and ID card reference.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {profileSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      <Check className="h-4 w-4" /> {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                      <AlertCircle className="h-4 w-4" /> {profileError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        className="bg-accent/40"
                      />
                      <p className="text-[10px] text-muted-foreground">Email changes require admin assistance.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 123 4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profilePending}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                    >
                      {profilePending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4.5 w-4.5 text-primary" /> Password & Security
                </CardTitle>
                <CardDescription>Keep your account secure by using a strong password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      <Check className="h-4 w-4" /> {passwordSuccess}
                    </div>
                  )}
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                      <AlertCircle className="h-4 w-4" /> {passwordError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordPending}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      {passwordPending ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Landlord Bank Transfer Details */}
            {profile?.global_role === "LANDLORD" && (
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Landmark className="h-4.5 w-4.5 text-primary" /> Bank Transfer Details
                  </CardTitle>
                  <CardDescription>Configure the bank details that tenants will use to pay their invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateBankDetails} className="space-y-4">
                    {bankSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                        <Check className="h-4 w-4" /> {bankSuccess}
                      </div>
                    )}
                    {bankError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                        <AlertCircle className="h-4 w-4" /> {bankError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Commercial Bank"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="accountName">Account Holder Name</Label>
                        <Input
                          id="accountName"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="e.g. John Doe Properties"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="e.g. 1000984832"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="branchName">Branch Name</Label>
                        <Input
                          id="branchName"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Colombo 07"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="swiftCode">SWIFT / BIC Code (Optional)</Label>
                      <Input
                        id="swiftCode"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value)}
                        placeholder="e.g. CCEYLKXX"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={bankPending}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                      >
                        {bankPending ? "Saving Bank Details..." : "Save Bank Details"}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Customize Primary Color Theme */}
            <ThemeSwitcherCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ThemeSwitcherCard() {
  const { colorTheme, setColorTheme } = useTheme();

  const themes: { id: ColorTheme; label: string; bg: string; border: string }[] = [
    { id: "shamrock", label: "Shamrock Green", bg: "bg-emerald-500", border: "border-emerald-500/20" },
    { id: "ocean", label: "Ocean Blue", bg: "bg-blue-500", border: "border-blue-500/20" },
    { id: "violet", label: "Royal Violet", bg: "bg-violet-500", border: "border-violet-500/20" },
    { id: "sunset", label: "Sunset Orange", bg: "bg-amber-500", border: "border-amber-500/20" },
    { id: "rose", label: "Blossom Rose", bg: "bg-rose-500", border: "border-rose-500/20" },
    { id: "slate", label: "Modern Slate", bg: "bg-slate-500", border: "border-slate-500/20" },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Palette className="h-4.5 w-4.5 text-primary" /> Primary Accent Color
        </CardTitle>
        <CardDescription>Select your preferred primary theme color for the workspace dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const isActive = colorTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setColorTheme(t.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:bg-accent/40"
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${t.bg} border ${t.border} flex-shrink-0`} />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
