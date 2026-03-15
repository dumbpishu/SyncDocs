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
        <h2 className="text-3xl font-semibold tracking-tight text-[#2f2f2b] sm:text-4xl">Sign in</h2>
        <p className="mt-3 text-sm leading-6 text-[#787774]">Use your email to receive a one-time code.</p>
      </div>

      <label className="mb-2 block text-sm font-medium text-[#37352f]" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-xl border border-[#dfddd7] bg-white px-4 py-3 text-[#2f2f2b] outline-none transition focus:border-[#b8b4ac]"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {error ? (
        <p className="mt-3 rounded-xl border border-[#ead5d1] bg-[#fff8f7] px-4 py-3 text-sm text-[#8a3c2f]">
          {error}
        </p>
      ) : null}

      <button
        onClick={handleSendOtp}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-[#2f2f2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#20201d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Sending..." : "Send code"}
      </button>
    </AuthLayout>
  );
}
