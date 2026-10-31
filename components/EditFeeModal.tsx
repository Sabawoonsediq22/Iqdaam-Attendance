"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateFeeSchema } from "@/lib/schema";
import { toast } from "sonner";
import type { UpdateFee } from "@/lib/schema";
import { useQueryClient } from "@tanstack/react-query";
import { humanizeError } from "@/lib/humanizeError";
import { DollarSign, GraduationCap, Loader2, User } from "lucide-react";

type FeeWithDetails = {
  id: string;
  studentId: string;
  classId: string;
  feeToBePaid: string;
  feePaid: string | null;
  feeUnpaid: string | null;
  paymentDate: Date | null;
  createdAt: Date;
  studentName: string;
  fatherName: string;
  className: string;
  teacherName: string;
};

interface EditFeeModalProps {
  fee: FeeWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditFeeModal({
  fee,
  isOpen,
  onClose,
  onSuccess,
}: EditFeeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<UpdateFee>({
    resolver: zodResolver(updateFeeSchema),
    defaultValues: {
      feeToBePaid: "",
      feePaid: "",
      feeUnpaid: "",
      paymentDate: "",
    },
  });

  // Update form when fee changes
  useEffect(() => {
    if (fee) {
      form.reset({
        feeToBePaid: fee.feeToBePaid || "",
        feePaid: fee.feePaid || "",
        feeUnpaid: fee.feeUnpaid || "",
        paymentDate: fee.paymentDate
          ? fee.paymentDate.toISOString().split("T")[0]
          : "",
      });
    }
  }, [fee, form]);

  const onSubmit = async (data: UpdateFee) => {
    if (!fee) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/fees/${fee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update fee");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/fees"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

      toast.success("Fee updated successfully");

      onClose();
      onSuccess();
    } catch (error) {
      toast.error(humanizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Edit form dialog: standard width scale (sm:max-w-lg) */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            >
              <DollarSign className="h-4 w-4" />
            </span>
            <span>Edit Fee Payment</span>
          </DialogTitle>
          <DialogDescription>
            Update the amounts and payment date for this fee record.
          </DialogDescription>
        </DialogHeader>

        {/* Fee summary */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <h4 className="text-sm font-medium text-foreground">
              {fee.studentName}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Class: {fee.className} | Teacher: {fee.teacherName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Total Fee: {parseFloat(fee.feeToBePaid).toLocaleString()}؋
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4 border bg-muted/30 p-4 rounded shadow">
            <FormField
              control={form.control}
              name="feeToBePaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter fee amount (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feePaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount paid (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feeUnpaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Unpaid</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount unpaid (؋)"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? "Updating..." : "Update Fee"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
