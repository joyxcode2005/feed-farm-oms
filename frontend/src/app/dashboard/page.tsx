/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// frontend/src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminInfo {
  email: string;
  name: string;
  phone: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/v1/admin/info", {
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      setAdminInfo(data.data);
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear cookies and redirect
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-black">
            Feed Management System
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black mb-2">
            Welcome, {adminInfo?.name}
          </h2>
          <p className="text-gray-600">
            {adminInfo?.email} • {adminInfo?.role}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ActionCard
            title="Feed Products"
            description="Manage feed inventory"
            onClick={() => router.push("/dashboard/feeds")}
          />
          <ActionCard
            title="Orders"
            description="View and manage orders"
            onClick={() => router.push("/dashboard/orders")}
          />
          <ActionCard
            title="Raw Materials"
            description="Track raw materials"
            onClick={() => router.push("/dashboard/materials")}
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Orders" value="--" />
          <StatCard title="Total Products" value="--" />
          <StatCard title="Pending Orders" value="--" />
          <StatCard title="Revenue" value="₹--" />
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-6 border border-gray-200 rounded-lg hover:border-black transition-colors text-left"
    >
      <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </button>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-black">{value}</p>
    </div>
  );
}