"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    XCircle,
    Store,
    Briefcase
} from "lucide-react";

export default function KYCCallbackPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"PROCESSING" | "SUCCESS" | "FAILED">("PROCESSING");
    const [message, setMessage] = useState("Verifying your identity with DigiLocker...");
    const [userName, setUserName] = useState("");
    const [loadingRole, setLoadingRole] = useState(false);

    useEffect(() => {
        const verifyStatus = async () => {
            const entityId = localStorage.getItem('kyc_entity_id');
            if (!entityId) {
                setStatus("FAILED");
                setMessage("Session not found. Please restart verification.");
                return;
            }

            try {
                const res = await api.post("/api/kyc/verify-status/", { entity_id: entityId });

                if (res.status === 200 || res.data.status === "SUCCESS") {
                    setStatus("SUCCESS");
                    setUserName(res.data.data?.name || "User");
                    localStorage.removeItem('kyc_entity_id'); // Cleanup
                } else if (res.status === 202) {
                    // Still processing, retry in 3 seconds
                    setTimeout(verifyStatus, 3000);
                } else {
                    setStatus("FAILED");
                    setMessage(res.data.error || "Verification failed.");
                }
            } catch (error: any) {
                console.error(error);
                setStatus("FAILED");
                setMessage(error.response?.data?.error || "Connection error.");
            }
        };

        verifyStatus();
    }, []);

    const handleRoleSelection = async (role: "SELLER" | "BROKER") => {
        setLoadingRole(true);
        try {
            await api.post("/api/user/upgrade/", { role });
            // Redirect to dashboard with success state
            window.location.href = '/dashboard/overview';
        } catch (error) {
            console.error(error);
            alert("Failed to update role. Please contact support.");
            setLoadingRole(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12 text-center">

                {status === "PROCESSING" && (
                    <div className="animate-pulse">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
                        <p className="text-gray-500">{message}</p>
                    </div>
                )}

                {status === "FAILED" && (
                    <div>
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-8">{message}</p>
                        <Button
                            onClick={() => router.push('/dashboard/kyc')}
                            variant="outline"
                            className="rounded-xl"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {status === "SUCCESS" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-50 text-primary-green rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified Successfully!</h2>
                        <p className="text-gray-500 mb-8">
                            Start your journey on SaudaPakka as a verified partner.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <button
                                onClick={() => handleRoleSelection("SELLER")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-primary-green hover:bg-green-50 transition-all group relative overflow-hidden"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-green group-hover:text-white transition-colors">
                                    <Store className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">I am an Owner</h3>
                                <p className="text-xs text-gray-500">I want to sell or rent my own properties.</p>
                            </button>

                            <button
                                onClick={() => handleRoleSelection("BROKER")}
                                disabled={loadingRole}
                                className="p-6 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group relative overflow-hidden"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">I am a Broker</h3>
                                <p className="text-xs text-gray-500">I define deals for multiple clients.</p>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
