"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "@/components/loader";
import { Shield, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function VerifyCodeForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // If no email in URL, redirect back to forgot password
      router.push("/auth/forgot-password");
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid code");
      }

      setIsSuccess(true);
      toast.success("Code verified successfully");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid code");
      toast.error(error instanceof Error ? error.message : "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      toast.success("New code sent to your email");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to resend code");
      toast.error(error instanceof Error ? error.message : "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Code Verified!</CardTitle>
            <CardDescription className="text-gray-600">
              Your verification code has been confirmed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)}
              className="w-full"
            >
              Continue to Reset Password
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/auth")}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Verify Code</CardTitle>
          <CardDescription className="text-gray-600">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  // Only allow digits and limit to 6 characters
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-sm text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  Resend Code
                </button>
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Different Email
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default function VerifyCodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader className="w-6 h-6" />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyCodeForm />
    </Suspense>
  );
}