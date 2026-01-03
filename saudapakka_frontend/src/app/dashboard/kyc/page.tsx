"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Loader2,
  ScanFace,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function KYCPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInitiateKYC = async () => {
    setLoading(true);
    try {
      // The redirect URL should point to our new callback page
      const redirectUrl = window.location.origin + '/dashboard/kyc/callback';

      const res = await api.post("/api/kyc/initiate/", {
        redirect_url: redirectUrl
      });

      const { entity_id, digilocker_url } = res.data;

      if (entity_id && digilocker_url) {
        // Store entity_id for the callback verification step
        localStorage.setItem('kyc_entity_id', entity_id);

        // Redirect user to DigiLocker
        window.location.href = digilocker_url;
      } else {
        alert("Failed to initiate verification session.");
      }

    } catch (error) {
      console.error(error);
      alert("Failed to connect to verification server.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        <p className="text-gray-500">Securely verify your identity via DigiLocker to unlock premium features.</p>
      </div>

      {/* Main Unified Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT: The Main Action Area */}
        <div className="flex-1 p-8 lg:p-12">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Government Verified</h2>
              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-full w-fit mt-1">
                <CheckCircle2 className="w-3 h-3" /> UIDAI Compliant
              </div>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="prose text-gray-500 text-sm leading-relaxed">
              <p>
                To maintain a verified community of trusted Sellers and Brokers, we require a one-time identity check.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li>You will be redirected to the official <strong>DigiLocker</strong> portal.</li>
                <li>Authenticate using your Aadhaar number and OTP.</li>
                <li>Grant permission to share your verified identity details.</li>
              </ul>
            </div>

            <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl flex gap-3 items-start">
              <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Privacy First</h4>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  We only request your Name and Verification Status. We do not store your biometrics or access other documents.
                </p>
              </div>
            </div>

            <Button
              onClick={handleInitiateKYC}
              disabled={loading}
              className="w-full h-14 bg-primary-green hover:bg-dark-green text-white font-bold rounded-xl shadow-lg shadow-green-900/10 transition-all text-base flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <ScanFace className="w-5 h-5" />
                  Verify with DigiLocker
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-4">
              By continuing, you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>

        {/* RIGHT: Benefits */}
        <div className="lg:w-80 bg-gray-50/80 border-l border-gray-100 p-8 lg:p-10 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Unlock Features</h3>

          <ul className="space-y-6">
            <li className="flex gap-3 items-start">
              <div className="mt-0.5 text-accent-green">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Become a Seller</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  List unlimited properties for sale or rent directly.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="mt-0.5 text-accent-green">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Verified Badge</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Gain trust with the blue verification tick on your profile.
                </p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="mt-0.5 text-accent-green">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Broker Account</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Register as a professional broker and manage client portfolios.
                </p>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}