"use client";

/**
 * ============================================================================
 * BACKOFFICE USERS TAB
 * ============================================================================
 * Manage internal users (BO, F&F, Beta) - Admin only access.
 * Does NOT list app users (too many, separate concern).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Users,
  UserCheck,
  FlaskConical,
  Heart,
} from "lucide-react";
import { useBackOfficeAuth } from "@/lib/backoffice/auth-store";

// User types that can be created
type UserType = "bo" | "friends_family" | "beta";

interface ManagedUser {
  id: string;
  visibleUserId: string;
  email: string;
  displayName: string | null;
  fullName: string | null;
  userType: UserType;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  inviteToken: string | null;
  inviteTokenExpiresAt: string | null;
  invitedAt: string | null;
  invitedBy: string | null;
  verifiedAt: string | null;
  referredBy: string | null;
  userReferenceId: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

const USER_TYPE_CONFIG: Record<UserType, { label: string; icon: typeof Users; color: string }> = {
  bo: { label: "BO User", icon: Shield, color: "bg-primary/10 text-primary" },
  friends_family: { label: "F&F Tester", icon: Heart, color: "bg-pink-500/10 text-pink-500" },
  beta: { label: "Beta Tester", icon: FlaskConical, color: "bg-purple-500/10 text-purple-500" },
};

export default function BackOfficeUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useBackOfficeAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteUserType, setInviteUserType] = useState<UserType>("bo");
  const [inviteRole, setInviteRole] = useState<"admin" | "operator" | "viewer">("operator");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<UserType | "all">("all");
  const [hydrated, setHydrated] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Admin-only access check
  useEffect(() => {
    if (hydrated && isAuthenticated && user?.role !== "admin") {
      router.push("/backoffice/field-schema");
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Fetch users on mount
  useEffect(() => {
    if (hydrated && user?.role === "admin") {
      fetchUsers();
    }
  }, [hydrated, user]);

  // Block rendering for non-admin users
  if (!hydrated || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/backoffice/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviting(true);

    try {
      const response = await fetch("/api/backoffice/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          displayName: inviteDisplayName || undefined,
          userType: inviteUserType,
          role: inviteUserType === "bo" ? inviteRole : "viewer",
          invitedBy: user?.email,
        }),
      });

      const result = await response.json();

      if (result.success && result.magicLink) {
        setMagicLink(result.magicLink);
        await fetchUsers();
      } else {
        setInviteError(result.error || "Failed to invite user");
      }
    } catch (error) {
      setInviteError("An error occurred. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRegenerateLink(userId: string) {
    setRegeneratingId(userId);
    try {
      const response = await fetch(`/api/backoffice/users/${userId}/regenerate-token`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success && result.magicLink) {
        setMagicLink(result.magicLink);
        setShowInviteModal(true);
        await fetchUsers(); // Refresh to update invited_at
      }
    } catch (error) {
      console.error("Failed to regenerate link:", error);
    } finally {
      setRegeneratingId(null);
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    setTogglingId(userId);
    try {
      const response = await fetch(`/api/backoffice/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentlyActive }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchUsers();
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setTogglingId(null);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(magicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function closeModal() {
    setShowInviteModal(false);
    setInviteEmail("");
    setInviteDisplayName("");
    setInviteUserType("bo");
    setInviteRole("operator");
    setInviteError("");
    setMagicLink("");
    setCopiedLink(false);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRoleColor(role: string): string {
    switch (role) {
      case "admin":
        return "bg-primary/10 text-primary";
      case "operator":
        return "bg-blue-500/10 text-blue-500";
      case "viewer":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  // Filter users by type
  const filteredUsers = filterType === "all" 
    ? users 
    : users.filter(u => u.userType === filterType);

  // Count by type
  const countByType = {
    all: users.length,
    bo: users.filter(u => u.userType === "bo").length,
    friends_family: users.filter(u => u.userType === "friends_family").length,
    beta: users.filter(u => u.userType === "beta").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Managed Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage BO, Friends & Family, and Beta users
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "bo", "friends_family", "beta"] as const).map((type) => {
          const isActive = filterType === type;
          const config = type === "all" 
            ? { label: "All Users", icon: Users, color: "bg-secondary text-foreground" }
            : USER_TYPE_CONFIG[type];
          const Icon = config.icon;
          
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? config.color
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                isActive ? "bg-background/20" : "bg-muted"
              }`}>
                {countByType[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Users List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No users found. Click &quot;Add User&quot; to invite someone.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Invited
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ref ID
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((managedUser) => {
                  const typeConfig = USER_TYPE_CONFIG[managedUser.userType] || USER_TYPE_CONFIG.bo;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <tr key={managedUser.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground">
                              {managedUser.email}
                            </span>
                          </div>
                          {managedUser.displayName && (
                            <span className="text-xs text-muted-foreground mt-0.5 ml-6">
                              {managedUser.displayName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getRoleColor(
                            managedUser.role
                          )}`}
                        >
                          {managedUser.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {/* Active/Inactive */}
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            managedUser.isActive ? "text-green-500" : "text-red-500"
                          }`}>
                            {managedUser.isActive ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" />
                                Inactive
                              </>
                            )}
                          </span>
                          {/* Verified/Pending */}
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            managedUser.isVerified ? "text-blue-500" : "text-amber-500"
                          }`}>
                            {managedUser.isVerified ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Verified
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(managedUser.invitedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          {managedUser.userReferenceId || managedUser.visibleUserId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Resend Invite (only for unverified) */}
                          {!managedUser.isVerified && (
                            <button
                              onClick={() => handleRegenerateLink(managedUser.id)}
                              disabled={regeneratingId === managedUser.id}
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                              title="Resend invite"
                            >
                              {regeneratingId === managedUser.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Resend
                            </button>
                          )}
                          {/* Toggle Active/Inactive */}
                          <button
                            onClick={() => handleToggleActive(managedUser.id, managedUser.isActive)}
                            disabled={togglingId === managedUser.id}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                              managedUser.isActive
                                ? "text-red-500 hover:bg-red-500/10"
                                : "text-green-500 hover:bg-green-500/10"
                            }`}
                            title={managedUser.isActive ? "Deactivate user" : "Activate user"}
                          >
                            {togglingId === managedUser.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : managedUser.isActive ? (
                              <ToggleRight className="h-3.5 w-3.5" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                            {managedUser.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {magicLink ? "Invite Created" : "Add New User"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {magicLink ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Share this magic link with the invited user:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={magicLink}
                      readOnly
                      className="flex-1 h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground font-mono truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The user must click this link to verify their account before they can login.
                  Link expires in 7 days.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{inviteError}</p>
                  </div>
                )}

                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    User Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["bo", "friends_family", "beta"] as const).map((type) => {
                      const config = USER_TYPE_CONFIG[type];
                      const Icon = config.icon;
                      const isSelected = inviteUserType === type;
                      
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setInviteUserType(type)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={isSelected ? "text-primary" : "text-muted-foreground"}>
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={inviteDisplayName}
                    onChange={(e) => setInviteDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Role selector only for BO users */}
                {inviteUserType === "bo" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                      className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="viewer">Viewer - Read only access</option>
                      <option value="operator">Operator - Standard access</option>
                      <option value="admin">Admin - Full access</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail}
                    className="flex-1 h-10 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {inviting ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Send Invite"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
