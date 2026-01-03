"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";

type User = {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    is_active_seller: boolean;
    is_active_broker: boolean;
    kyc_status: string;
};

export default function AdminUsersPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, BROKER, SELLER

    useEffect(() => {
        fetchUsers();
    }, [filter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/admin/users/?role=${filter}`);
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
        // Placeholder for blocking functionality
        alert("Block/Unblock feature coming soon!");
    };

    if (!user?.is_staff) {
        return <div className="p-8 text-center text-red-600">Access Denied. Admins Only.</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border p-2 rounded-lg bg-white"
                    >
                        <option value="ALL">All Users</option>
                        <option value="BROKER">Brokers Only</option>
                        <option value="SELLER">Sellers Only</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                                                <div className="text-sm text-gray-500">{u.email}</div>
                                                <div className="text-xs text-gray-400">{u.phone_number}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            {u.is_active_broker && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">Broker</span>}
                                            {u.is_active_seller && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 w-fit">Seller</span>}
                                            {!u.is_active_broker && !u.is_active_seller && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 w-fit">User</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.kyc_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                            u.kyc_status === 'INITIATED' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {u.kyc_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            onClick={() => toggleBlockUser(u.id, true)}
                                            className="text-red-600 hover:text-red-900 font-medium"
                                        >
                                            Block
                                        </button>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
