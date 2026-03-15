import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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
      setError("Enter the 6-digit OTP from your inbox.");
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
    } catch (error) {
      setError(getApiErrorMessage(error, "That OTP didn't work. Double-check the code and try again."));
    } finally {
      setLoading(false);
    }
  };

  if (!email) return <Navigate to="/login" replace />;

  return (
    <AuthLayout>
      <div className="mb-8 animate-[slideUp_500ms_ease-out]">
        <h2 className="text-3xl font-semibold tracking-tight text-[#191919] sm:text-4xl">
          Check your inbox
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">
          We sent a one-time passcode to <span className="font-medium text-[#191919]">{email}</span>.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-[#3f3f3f]" htmlFor="otp">
        One-time passcode
      </label>
      <input
        id="otp"
        inputMode="numeric"
        maxLength={6}
        placeholder="Enter OTP"
        className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-[#191919] outline-none transition focus:border-[#191919]"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
      />

      {error ? (
        <p className="mt-3 rounded-xl border border-black/8 bg-[#f1f1ef] px-4 py-3 text-sm text-[#3f3f3f] animate-[fadeIn_250ms_ease-out]">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-[#191919] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
    </AuthLayout>
  );
}
