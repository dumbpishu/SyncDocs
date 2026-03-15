import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-black/8 bg-[#fbfbfa] shadow-[0_8px_30px_rgba(15,15,15,0.04)] animate-[fadeIn_400ms_ease-out] md:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden border-r border-black/8 bg-[#f3f3f1] px-10 py-12 text-[#191919] md:block">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-[#6b6b6b]">
              SyncDocs
            </p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight">
              Write together with clarity and focus.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#6b6b6b]">
              Email OTP keeps onboarding lightweight while your session stays alive in the background with secure cookie-based auth.
            </p>

            <div className="mt-10 space-y-4">
              <FeaturePill label="Professional workspace" />
              <FeaturePill label="Secure session recovery" />
              <FeaturePill label="Owner and collaborator views" />
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-[#6b6b6b] md:hidden">
              SyncDocs
            </p>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturePill({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-black/8 bg-white px-4 py-3 text-sm text-[#44403c]">
      {label}
    </div>
  );
}
