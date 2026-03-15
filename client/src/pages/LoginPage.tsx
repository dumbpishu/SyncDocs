import { useState } from "react";
import { sendOtp } from "../api/auth.api";
import AuthLayout from "../components/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../utils/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Enter your email to receive a sign-in code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtp(trimmedEmail);
      navigate("/verify-otp", { state: { email: trimmedEmail } });
    } catch (error) {
      setError(getApiErrorMessage(error, "We couldn't send the OTP right now. Please try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 animate-[slideUp_500ms_ease-out]">
        <h2 className="text-3xl font-semibold tracking-tight text-[#191919] sm:text-4xl">
          Sign in with email
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6b6b6b]">
          We&apos;ll email a one-time passcode so you can jump back into your collaborative workspace without a password.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-[#3f3f3f]" htmlFor="email">
        Work email
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-[#191919] outline-none transition focus:border-[#191919]"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error ? (
        <p className="mt-3 rounded-xl border border-black/8 bg-[#f1f1ef] px-4 py-3 text-sm text-[#3f3f3f] animate-[fadeIn_250ms_ease-out]">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleSendOtp}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-[#191919] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending code..." : "Send OTP"}
      </button>
    </AuthLayout>
  );
}
