import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(199,210,254,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(186,230,253,0.18),_transparent_22%),linear-gradient(180deg,#fafbfc_0%,#f3f5f7_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white shadow-[0_24px_54px_rgba(15,23,42,0.08)] md:grid-cols-[0.95fr_460px]">
        <div className="hidden border-r border-[#eef2f6] bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fa_100%)] px-10 py-12 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#0f172a,#334155)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
              S
            </div>
            <p className="text-sm font-semibold text-[#101828]">SyncDocs</p>
          </div>

          <h1 className="mt-10 max-w-sm text-5xl font-semibold tracking-[-0.04em] text-[#101828]">
            Sign in and get back to work.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-[#667085]">
            Access your documents, collaborators, and editor workspace with a simple one-time code.
          </p>

          <div className="mt-10 space-y-3 text-sm text-[#667085]">
            <p>Real-time collaborative editor</p>
            <p>Owner, editor, and viewer access</p>
            <p>PDF export and account controls</p>
          </div>
        </div>

        <div className="p-8 sm:p-10 md:p-12">
          <div className="mb-8 md:hidden">
            <p className="text-sm font-semibold text-[#101828]">SyncDocs</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
