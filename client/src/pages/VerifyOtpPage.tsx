import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { verifyOtp } from "../api/auth.api";
import AuthLayout from "../components/layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

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
      setError("Enter the 6-digit OTP from your inbox.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await verifyOtp(email, otp.trim());
      markAuthenticated(data.user);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("That OTP didn't work. Double-check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <Navigate to="/login" replace />;

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
          Check your inbox
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          We sent a one-time passcode to <span className="font-medium text-stone-900">{email}</span>.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="otp">
        One-time passcode
      </label>
      <input
        id="otp"
        inputMode="numeric"
        maxLength={6}
        placeholder="Enter OTP"
        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
      />

      {error ? (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </AuthLayout>
  );
}
