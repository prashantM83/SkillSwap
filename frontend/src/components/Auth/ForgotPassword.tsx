import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../features/auth/axiosConfig";
// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Step = "email" | "otp" | "password" | "success";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.toLowerCase() });
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: email.toLowerCase(), otp });
      toast.success("OTP verified!");
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.toLowerCase(),
        otp,
        newPassword,
      });
      toast.success("Password reset successfully!");
      setStep("success");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shadow-sm">
                {step === "success" ? (
                  <CheckCircle size={24} className="text-white" />
                ) : (
                  <KeyRound size={24} className="text-white" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-black mb-2">
              {step === "email" && "Forgot Password"}
              {step === "otp" && "Verify OTP"}
              {step === "password" && "Reset Password"}
              {step === "success" && "Password Reset!"}
            </CardTitle>
            <p className="text-gray-600">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "password" && "Create your new password"}
              {step === "success" &&
                "Your password has been reset successfully"}
            </p>
          </CardHeader>
          <CardContent>
            {step === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="mb-3">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <Label htmlFor="otp" className="mb-3">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    OTP is valid for 10 minutes
                  </p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Email
                </Button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Label htmlFor="newPassword" className="mb-3">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-12"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-3">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
                      size={20}
                    />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li
                      className={`flex items-center space-x-2 ${newPassword.length >= 6 ? "text-green-600" : ""}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${newPassword.length >= 6 ? "bg-green-500" : "bg-gray-400"}`}
                      ></div>
                      <span>At least 6 characters</span>
                    </li>
                    <li
                      className={`flex items-center space-x-2 ${newPassword && confirmPassword && newPassword === confirmPassword ? "text-green-600" : ""}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? "bg-green-500" : "bg-gray-400"}`}
                      ></div>
                      <span>Passwords match</span>
                    </li>
                  </ul>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {step === "success" && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <p className="text-gray-600">
                  You can now login with your new password.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/auth/login")}
                >
                  Go to Login
                </Button>
              </div>
            )}

            {step !== "success" && (
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Remember your password?{" "}
                  <NavLink
                    to="/auth/login"
                    className="font-semibold text-black hover:text-gray-700 transition-colors"
                  >
                    Sign In
                  </NavLink>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
