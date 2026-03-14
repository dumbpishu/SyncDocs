import { useState } from "react";
import { sendOtp } from "../api/auth.api";
import AuthLayout from "../components/AuthLayout";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {

    setLoading(true);

    try {

      await sendOtp(email);

      navigate("/verify-otp", { state: { email } });

    } catch {
      alert("Failed to send OTP");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>

      <h2 className="text-lg font-semibold mb-4">
        Login with Email
      </h2>

      <input
        type="email"
        placeholder="Enter your email"
        className="w-full border rounded-md px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleSendOtp}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        {loading ? "Sending..." : "Send OTP"}
      </button>

    </AuthLayout>
  );
}
