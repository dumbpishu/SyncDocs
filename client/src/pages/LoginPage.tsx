import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../api/auth.api";
import AuthLayout from "../components/layouts/AuthLayout";
import { getApiErrorMessage } from "../utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Enter your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtp(trimmedEmail);
      navigate("/verify-otp", { state: { email: trimmedEmail } });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to send the code."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#98a2b3]">Sign in</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828] sm:text-5xl">
          Enter your email to continue.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#667085]">
          We'll send a one-time code so you can access the workspace without a password.
        </p>
      </div>

      <div className="rounded-[24px] border border-[#e4e7ec] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <label className="mb-2 block text-sm font-medium text-[#344054]" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-[#101828] outline-none transition focus:border-[#274690]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        {error ? (
          <p className="mt-4 rounded-xl border border-[#f0d5dd] bg-[#fff7f8] px-4 py-3 text-sm text-[#b42318]">
            {error}
          </p>
        ) : null}

        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send code"}
        </button>
      </div>
    </AuthLayout>
  );
}
