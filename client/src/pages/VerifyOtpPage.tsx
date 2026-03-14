import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { verifyOtp } from "../api/auth.api";
import AuthLayout from "../components/AuthLayout";

export default function VerifyOtpPage() {

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {

    setLoading(true);

    try {

      await verifyOtp(email, otp);

      navigate("/dashboard");

    } catch {

      alert("Invalid OTP");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>

      <h2 className="text-lg font-semibold mb-4">
        Verify OTP
      </h2>

      <input
        placeholder="Enter OTP"
        className="w-full border rounded-md px-3 py-2 mb-4 focus:ring-2 focus:ring-green-500 outline-none"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button
        onClick={handleVerify}
        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

    </AuthLayout>
  );
}
