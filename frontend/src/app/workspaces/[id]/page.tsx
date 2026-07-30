"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams?.id) {
      router.replace(`/workspaces/${resolvedParams.id}/chat`);
    }
  }, [resolvedParams, router]);

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Đang chuyển hướng tới Workspace...</p>
      </div>
    </div>
  );
}
