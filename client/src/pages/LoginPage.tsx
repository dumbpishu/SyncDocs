import { useState } from "react";
import { sendOtp } from "../api/auth.api";
import AuthLayout from "../components/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";

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
    } catch {
      setError("We couldn't send the OTP right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-tight text-stone-900">
          Sign in with email
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          We&apos;ll email a one-time passcode so you can jump back into your collaborative workspace without a password.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="email">
        Work email
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {error ? (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleSendOtp}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending code..." : "Send OTP"}
      </button>
    </AuthLayout>
  );
}
