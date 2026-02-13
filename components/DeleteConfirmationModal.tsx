"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDeleting?: boolean;
  itemCount?: number; // Number of items being deleted (for bulk operations)
}

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="sm:max-w-[400px] max-w-[350px] rounded-2xl p-0 border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-linear-to-r from-gray-900 to-gray-800 text-white">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  {title}
                </DialogTitle>
              </div>

              <div className="p-6">
                <DialogDescription className="text-left">
                  {itemCount && itemCount > 1 ? (
                    <div>
                      <span className="font-semibold block mb-2">
                        Deleting {itemCount} class{itemCount > 1 ? "es" : ""}
                      </span>
                      <span>{description}</span>
                    </div>
                  ) : (
                    description
                  )}
                </DialogDescription>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="cursor-pointer"
                  >
                    {isDeleting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
