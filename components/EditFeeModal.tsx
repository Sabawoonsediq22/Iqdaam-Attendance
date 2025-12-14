"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Loader2 } from "lucide-react";

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
      feePaid: "",
      feeUnpaid: "",
      paymentDate: "",
    },
  });

  // Update form when fee changes
  useEffect(() => {
    if (fee) {
      form.reset({
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-w-[430px] rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Fee Payment</DialogTitle>
        </DialogHeader>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium">{fee.studentName}</h4>
          <p className="text-sm text-muted-foreground">
            Class: {fee.className} | Teacher: {fee.teacherName}
          </p>
          <p className="text-sm text-muted-foreground">
            Total Fee: {fee.feeToBePaid}؋
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSubmitting ? "Updating..." : "Update Fee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
