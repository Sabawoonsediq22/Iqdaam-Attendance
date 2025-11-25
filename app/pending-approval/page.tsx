"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Shield, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  const checkStatus = async () => {
    const email = localStorage.getItem('pendingUserEmail');
    if (!email) {
      toast.error("No email found. Please try registering again.");
      return;
    }

    setIsCheckingStatus(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/users/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      if (data.isApproved) {
        setIsApproved(true);
        setStatusMessage("🎉 Your account has been approved! You can now sign in.");
        toast.success("Account approved! Redirecting to login...");
        setTimeout(() => {
          router.push('/auth');
        }, 2000);
      } else {
        setStatusMessage("Your account is still pending approval. Please check back later.");
        toast.info("Still pending approval");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check status');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-100 to-orange-100 border border-amber-200">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Account Pending Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your account is being reviewed by an administrator
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-amber-500" />
              Approval Required
            </CardTitle>
            <CardDescription>
              Your account has been created successfully but requires approval from an administrator before you can access the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Alert */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Please check back later. You will receive access once an administrator approves your account.
                You can safely close this page and return later.
              </AlertDescription>
            </Alert>

            {/* Status Message */}
            {statusMessage && (
              <Alert className={isApproved ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-950" : "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"}>
                {isApproved ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-600" />
                )}
                <AlertDescription className={isApproved ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"}>
                  {statusMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={checkStatus}
                className="w-full"
                variant="outline"
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin text-primary" />
                    Checking...
                  </>
                ) : (
                  "Check Status"
                )}
              </Button>
              <Button
                onClick={() => router.push("/auth")}
                className="w-full"
                variant="ghost"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Student Attendance Tracking System
          </p>
        </div>
      </div>
    </div>
  );
}