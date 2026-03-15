import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { verifyOtp } from "../api/auth.api";
import AuthLayout from "../components/layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/api";

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { markAuthenticated } = useAuth();
  const email = location.state?.email as string | undefined;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!email) {
      navigate("/login", { replace: true });
      return;
    }

    if (!otp.trim()) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyOtp(email, otp.trim());
      if (data?.user) {
        markAuthenticated(data.user);
      }
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to verify the code."));
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <Navigate to="/login" replace />;

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98a2b3]">Verification</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828] sm:text-5xl">
          Confirm your access code.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#667085]">
          A one-time code was sent to <span className="font-medium text-[#101828]">{email}</span>.
        </p>
      </div>

      <div className="rounded-[24px] border border-[#e4e7ec] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <label className="mb-2 block text-sm font-medium text-[#344054]" htmlFor="otp">
          6-digit code
        </label>
        <input
          id="otp"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          className="w-full rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-[#101828] outline-none transition focus:border-[#274690]"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
        />

        {error ? (
          <p className="mt-4 rounded-xl border border-[#f0d5dd] bg-[#fff7f8] px-4 py-3 text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Verifying..." : "Continue"}
        </button>
      </div>
    </AuthLayout>
  );
}
