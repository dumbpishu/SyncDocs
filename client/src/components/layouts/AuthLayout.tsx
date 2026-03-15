import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f6f3] px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden rounded-[24px] border border-[#e8e6e1] bg-[#fbfbfa] shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:grid-cols-[1fr_420px]">
        <div className="hidden border-r border-[#e8e6e1] bg-[#f3f2ef] px-10 py-12 md:block">
          <p className="text-sm font-semibold text-[#37352f]">SyncDocs</p>
          <h1 className="mt-6 max-w-sm text-4xl font-semibold tracking-tight text-[#2f2f2b]">
            Collaborative documents, without the noise.
          </h1>
          <div className="mt-10 space-y-3 text-sm text-[#5f5e5b]">
            <div className="rounded-2xl border border-[#e1dfda] bg-white px-4 py-3">Real-time editing</div>
            <div className="rounded-2xl border border-[#e1dfda] bg-white px-4 py-3">Owner and collaborator access</div>
            <div className="rounded-2xl border border-[#e1dfda] bg-white px-4 py-3">Passwordless sign-in</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="mb-3 text-sm font-medium text-[#787774] md:hidden">SyncDocs</p>
          {children}
        </div>
      </div>
    </div>
  );
}
