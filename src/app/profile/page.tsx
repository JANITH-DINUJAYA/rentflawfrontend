"use client";

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { User, KeyRound, Check, AlertCircle, Copy } from "lucide-react";

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

  const [copied, setCopied] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setProfile(res.data);
      setFirstName(res.data.first_name || "");
      setLastName(res.data.last_name || "");
      setPhone(res.data.phone || "");
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
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all duration-200"
                    >
                      {passwordPending ? "Updating Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
