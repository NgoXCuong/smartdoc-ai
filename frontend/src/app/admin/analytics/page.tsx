"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { adminApi } from "@/services/api";
import {
  Activity,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Calendar
} from "lucide-react";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await adminApi.getUsage();
      setData(res.data);
    } catch (error) {
      console.error("Fetch usage error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Đang tải dữ liệu...</div>;
  if (!data) return <div className="p-8">Không có dữ liệu thống kê.</div>;

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Giám sát hệ thống & Chi phí</h1>
        <p className="text-slate-500">Phân tích lượng token tiêu thụ và hiệu năng xử lý tài liệu.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng Token</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {data.stats.reduce((acc: number, curr: any) => acc + curr.totalTokens, 0).toLocaleString()}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>+12% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Số lượt Chat</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {data.stats.find((s: any) => s._id === "chat")?.count || 0}
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">Trung bình 24 lượt/ngày</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Xử lý TB</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {((data.stats.find((s: any) => s._id === "embedding")?.avgProcessingTime || 0) / 1000).toFixed(1)}s
              </h3>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">Mục tiêu: Dưới 5s</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tỷ lệ Lỗi</p>
              <h3 className="text-2xl font-bold text-slate-900">0.8%</h3>
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium text-green-600">Mức an toàn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token Usage Chart */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Lượng Token theo ngày</h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              7 ngày gần nhất
            </div>
          </div>
          <div className="h-[300px] w-full min-w-0">
            {isMounted && data.timeline?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data.timeline}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tokens"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTokens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300 italic text-sm">
                Chưa có dữ liệu thống kê theo ngày
              </div>
            )}
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-w-0">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900">Phân bổ hoạt động</h2>
          </div>
          <div className="h-[300px] w-full min-w-0">
            {isMounted && data.stats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data.stats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-300 italic text-sm">
                Chưa có dữ liệu phân bổ hoạt động
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
