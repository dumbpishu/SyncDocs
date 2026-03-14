import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fef3c7,_#fff7ed_35%,_#fafaf9_70%)] px-6 py-10">
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(135deg,_rgba(234,88,12,0.14),_transparent_60%)]" />
      <div className="absolute left-20 top-24 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="absolute -right-16 bottom-8 h-48 w-48 rounded-full bg-amber-100 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/70 bg-white/85 shadow-[0_25px_80px_rgba(120,53,15,0.12)] backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-stone-900 px-10 py-12 text-stone-100 md:block">
            <p className="mb-4 text-sm uppercase tracking-[0.28em] text-orange-300">
              SyncDocs
            </p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight">
              Write together with presence, speed, and calm.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-stone-300">
              Email OTP keeps onboarding lightweight while your session stays alive in the background with secure cookie-based auth.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-orange-600 md:hidden">
              SyncDocs
            </p>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
