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
        <h2 className="text-3xl font-semibold tracking-tight text-[#2f2f2b] sm:text-4xl">Verify code</h2>
        <p className="mt-3 text-sm leading-6 text-[#787774]">
          A one-time code was sent to <span className="font-medium text-[#37352f]">{email}</span>.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-[#37352f]" htmlFor="otp">
        Code
      </label>
      <input
        id="otp"
        inputMode="numeric"
        maxLength={6}
        placeholder="123456"
        className="w-full rounded-xl border border-[#dfddd7] bg-white px-4 py-3 text-[#2f2f2b] outline-none transition focus:border-[#b8b4ac]"
        value={otp}
        onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
      />

      {error ? (
        <p className="mt-3 rounded-xl border border-[#ead5d1] bg-[#fff8f7] px-4 py-3 text-sm text-[#8a3c2f]">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-[#2f2f2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20201d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>
    </AuthLayout>
  );
}
