"use client";

/**
 * Navigation Confirmation Dialog
 * 
 * Shows when user tries to navigate away with unsaved changes.
 * - For offer creation: "You have unsaved offer details. Discard changes?"
 * - For profile edit: "You have unsaved profile changes. Save before leaving?"
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigationGuard } from "@/lib/navigation-guard";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  onConfirmNavigation: () => void;
};

export function NavigationConfirmDialog({ onConfirmNavigation }: Props) {
  const {
    showConfirmDialog,
    setShowConfirmDialog,
    getActiveBlocker,
    clearAllBlockers,
    setPendingNavigation,
  } = useNavigationGuard();

  const [saving, setSaving] = useState(false);
  const blocker = getActiveBlocker();

  if (!blocker) return null;

  const isOfferCreation = blocker.type === "offer-creation";
  const isProfileEdit = blocker.type === "profile-edit";

  const handleDiscard = () => {
    clearAllBlockers();
    setShowConfirmDialog(false);
    onConfirmNavigation();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const handleSave = async () => {
    if (blocker.onSave) {
      setSaving(true);
      try {
        await blocker.onSave();
        clearAllBlockers();
        setShowConfirmDialog(false);
        onConfirmNavigation();
      } catch {
        // Save failed, stay on current page
        setSaving(false);
      }
    }
  };

  return (
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOfferCreation && "Discard Offer?"}
            {isProfileEdit && "Unsaved Changes"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blocker.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleCancel} disabled={saving}>
            {isOfferCreation ? "Continue Editing" : "Cancel"}
          </AlertDialogCancel>
          
          {isProfileEdit && blocker.onSave && (
            <AlertDialogAction
              onClick={handleSave}
              disabled={saving}
              className="bg-primary"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </AlertDialogAction>
          )}
          
          <AlertDialogAction
            onClick={handleDiscard}
            disabled={saving}
            className={isProfileEdit ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            {isOfferCreation ? "Discard" : "Discard Changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
