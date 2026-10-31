"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Shield, CheckCircle, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-warning/20 bg-warning/10">
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Account Pending Approval
          </h1>
          <p className="text-muted-foreground">
            Your account is being reviewed by an administrator
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              Approval Required
            </CardTitle>
            <CardDescription>
              Your account has been created successfully but requires approval from an administrator before you can access the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info Alert */}
            <Alert variant="info">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Please check back later. You will receive access once an administrator approves your account.
                You can safely close this page and return later.
              </AlertDescription>
            </Alert>

            {/* Status Message */}
            {statusMessage && (
              <Alert variant={isApproved ? "success" : "info"}>
                {isApproved ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <AlertDescription>
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
                    <Loader2 className="animate-spin" />
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
          <p className="text-xs text-muted-foreground">
            Student Attendance Tracking System
          </p>
        </div>
      </div>
    </div>
  );
}