"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting?: boolean;
  itemCount?: number; // Number of items being deleted (for bulk operations)
}

/**
 * Standard destructive confirmation dialog.
 * Uses the shared dialog primitive: width = sm:max-w-md, padding/close/radius
 * come from the primitive, header uses the icon-chip pattern, actions sit in a
 * right-aligned, top-bordered footer.
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDeleting = false,
  itemCount,
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {itemCount && itemCount > 1 ? (
              <span className="block">
                <span className="font-semibold text-foreground">
                  Deleting {itemCount} classes
                </span>
                <span className="mt-1 block">{description}</span>
              </span>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
