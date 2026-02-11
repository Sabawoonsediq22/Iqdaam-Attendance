"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-[500px] h-screen sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-none p-0 border-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-linear-to-r from-gray-900 to-gray-800 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Edit Fee Payment
          </DialogTitle>
        </div>
        
        <div className="mb-4 p-4 rounded-lg bg-muted/30 shadow-sm border m-6">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground">{fee.studentName}</h4>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Class: {fee.className} | Teacher: {fee.teacherName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Total Fee: {parseFloat(fee.feeToBePaid).toLocaleString()}؋
            </p>
          </div>
        </div>
        <div className="p-2 sm:p-4 rounded-lg py-4 bg-muted/30 shadow border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
            <div className="flex sm:justify-end justify-center items-center space-x-2 mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="cursor-pointer w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSubmitting ? "Updating..." : "Update Fee"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
