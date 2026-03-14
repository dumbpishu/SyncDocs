import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import DashboardPage from "./pages/DashboardPage";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<LoginPage />} />

        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}
