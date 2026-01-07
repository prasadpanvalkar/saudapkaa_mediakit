"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, KeyRound, Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Send OTP
  const handleSendOtp = async () => {
    if (!email) return alert("Please enter your email");
    setLoading(true);
    try {
      await api.post("/api/auth/login/", { email });
      setStep("OTP");
    } catch (error) {
      alert("Error sending OTP. Please check your connection.");
      console.error(error);
    }
    setLoading(false);
  };

  // 2. Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp) return alert("Please enter the OTP");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify/", { email, otp });

      const data = res.data;
      const accessToken = data.access || data.token || data.tokens?.access;
      const user = data.user || data;

      if (!accessToken) throw new Error("No access token found");

      setAuth(user, accessToken);

      if (!user.full_name || user.full_name.trim() === "") {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard/overview");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.detail || "Invalid OTP. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden">

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
        {/* Lighter Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-green/90 via-dark-green/80 to-black/60"></div>
      </div>

      {/* Floating Blobs (Hidden on very small screens to save performance) */}
      <div className="hidden sm:block absolute top-[-10%] right-[-10%] w-96 h-96 bg-accent-green/30 rounded-full blur-3xl animate-float"></div>
      <div className="hidden sm:block absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-delayed"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-6">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-white/90 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* GLASS CARD */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 md:p-10 rounded-3xl shadow-2xl border border-white/40 ring-1 ring-black/5">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark-green mb-2 tracking-tight">
              sauda<span className="text-accent-green">pakka</span>
            </h1>
            <p className="text-gray-500 text-sm">
              {step === "EMAIL" ? "Sign in to manage your property portfolio" : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">

            {step === "EMAIL" ? (
              // STEP 1: EMAIL
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-accent-green transition-colors" />
                    <Input
                      placeholder="name@example.com"
                      className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-accent-green focus:ring-4 focus:ring-accent-green/10 transition-all text-base"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary-green to-accent-green hover:to-primary-green text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue with Email"}
                </Button>
              </div>

            ) : (
              // STEP 2: OTP
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Verification Code</label>
                  <Input
                    placeholder="Digits Only"
                    className="h-12 text-center rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-accent-green focus:ring-4 focus:ring-accent-green/10 transition-all text-2xl font-bold tracking-[0.2em] text-gray-800"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    maxLength={6}
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full h-12 bg-dark-green hover:bg-primary-green text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                </Button>

                <div className="text-center">
                  <button
                    onClick={() => setStep("EMAIL")}
                    className="text-sm text-gray-400 hover:text-accent-green transition-colors font-medium"
                  >
                    Change Email Address
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-2">
              <Lock className="w-3 h-3" /> Secure Encrypted Login
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              By continuing, you agree to our <a href="#" className="underline hover:text-primary-green">Terms of Service</a> and <a href="#" className="underline hover:text-primary-green">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}