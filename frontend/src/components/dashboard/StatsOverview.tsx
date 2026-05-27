import React from 'react';
import { FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface StatsOverviewProps {
  user: any;
  documentsLength: number;
  completedDocs: number;
  processingDocs: number;
}

export default function StatsOverview({ user, documentsLength, completedDocs, processingDocs }: StatsOverviewProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">
          Xin chào, {user?.username}! 👋
        </h1>
        <p className="text-slate-500 text-[13px] font-medium">Quản lý và hội thoại thông minh với tài liệu của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatsCard
          icon={<div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><FileText size={20} /></div>}
          title="Tổng tài liệu"
          value={documentsLength.toString()}
          label="Trong 30 ngày"
          labelClass="text-slate-500"
        />
        <StatsCard
          icon={<div className="w-10 h-10 bg-green-50 text-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 size={20} /></div>}
          title="Đã hoàn thành"
          value={completedDocs.toString()}
          label="100%"
          labelClass="text-green-500 font-bold"
        />
        <StatsCard
          icon={<div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center"><RefreshCw size={20} /></div>}
          title="Đang xử lý"
          value={processingDocs.toString()}
          label="Chờ xử lý"
          labelClass="text-slate-500"
        />
      </div>
    </>
  );
}

function StatsCard({ icon, title, value, label, labelClass }: { icon: React.ReactNode, title: string, value: string, label: string, labelClass: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between h-[130px] hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        {icon}
        <span className={`text-[11px] font-semibold ${labelClass}`}>{label}</span>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}
