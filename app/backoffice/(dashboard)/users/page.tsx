"use client";

/**
 * ============================================================================
 * BACKOFFICE USERS TAB
 * ============================================================================
 * Manage internal backoffice users (separate from app/customer users).
 * Admin can invite new users and generate magic links.
 */

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { getBackofficeUsers, inviteBackofficeUser, regenerateMagicLink } from "@/lib/backoffice/api";

interface BackofficeUser {
  id: string;
  email: string;
  role: string;
  addedAt: string;
  addedBy: string;
  isVerified?: boolean;
  displayName?: string;
  status?: string;
  verifiedAt?: string;
}

export default function BackOfficeUsersPage() {
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "operator" | "viewer">("operator");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await getBackofficeUsers();
      setUsers(data);
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
      const result = await inviteBackofficeUser(inviteEmail, inviteRole);
      
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
      const result = await regenerateMagicLink(userId);
      if (result.success && result.magicLink) {
        setMagicLink(result.magicLink);
        setShowInviteModal(true);
      }
    } catch (error) {
      console.error("Failed to regenerate link:", error);
    } finally {
      setRegeneratingId(null);
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
    setInviteRole("operator");
    setInviteError("");
    setMagicLink("");
    setCopiedLink(false);
  }

  function formatDate(dateString: string): string {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Backoffice Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage internal users with backoffice access
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add New User
        </button>
      </div>

      {/* Users List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No backoffice users yet. Click &quot;Add New User&quot; to invite someone.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Invited At
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(user.addedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!user.isVerified && (
                        <button
                          onClick={() => handleRegenerateLink(user.id)}
                          disabled={regeneratingId === user.id}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          title="Regenerate magic link"
                        >
                          {regeneratingId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Get Link
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
                {magicLink ? "Invite Created" : "Invite New User"}
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
