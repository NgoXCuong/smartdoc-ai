import React from 'react';
import { FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  user: any;
  documentsLength: number;
  completedDocs: number;
  processingDocs: number;
}

export default function StatsOverview({ user, documentsLength, completedDocs, processingDocs }: StatsOverviewProps) {
  return (
    <>
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight text-slate-900">
          Xin chào, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">{user?.username}</span>! 👋
        </h1>
        <p className="text-slate-500 text-base font-medium">Quản lý và hội thoại thông minh với tài liệu của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatsCard
          icon={<FileText className="text-indigo-600" size={24} />}
          bg="bg-indigo-50"
          label="Tổng tài liệu"
          value={documentsLength.toString()}
        />
        <StatsCard
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
          bg="bg-emerald-50"
          label="Đã hoàn thành"
          value={completedDocs.toString()}
        />
        <StatsCard
          icon={<Loader2 className="text-amber-500 animate-spin" size={24} />}
          bg="bg-amber-50"
          label="Đang xử lý"
          value={processingDocs.toString()}
        />
      </div>
    </>
  );
}

function StatsCard({ icon, label, value, bg }: { icon: React.ReactNode, label: string, value: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 group cursor-default">
      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", bg)}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
