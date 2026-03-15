import { createBrowserRouter } from "react-router-dom";

import RootLayout from "../components/layouts/RootLayout";

import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import DashboardPage from "../pages/DashboardPage";
import DocumentEditorPage from "../pages/DocumentEditorPage";
import AccountPage from "../pages/AccountPage";

import ProtectedRoute from "../components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [

      { index: true, element: <LandingPage /> },

      { path: "login", element: <LoginPage /> },

      { path: "verify-otp", element: <VerifyOtpPage /> },

      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: "account",
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        )
      },
      {
        path: "documents/:id",
        element: (
          <ProtectedRoute>
            <DocumentEditorPage />
          </ProtectedRoute>
        )
      }

    ]
  }
]);
