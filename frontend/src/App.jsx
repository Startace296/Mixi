import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import InfoLayout from './layouts/InfoLayout';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import {
  ForgotPasswordPage,
  ForgotVerifyPage,
  ResetPasswordPage,
} from './pages/ForgotPasswordPages';
import SignUpPage from './pages/SignUpPage';
import VerifyPage from './pages/VerifyPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { AboutUsPage, HelpPage, PoliciesPage } from './pages/InfoPages';
import HomePage from './pages/HomePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-verify" element={<ForgotVerifyPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/callback/:provider" element={<AuthCallbackPage />} />
        <Route element={<InfoLayout />}>
          <Route path="about" element={<AboutUsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="policies" element={<PoliciesPage />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/friends" element={<Navigate to="/friends/requests" replace />} />
          <Route path="/friends/requests" element={<HomePage />} />
          <Route path="/friends/all" element={<HomePage />} />
          <Route
            path="/messages"
            element={<HomePage />}
          />
          <Route path="/messages/:threadId" element={<HomePage />} />
          <Route path="/profile" element={<HomePage />} />
          <Route path="/profile/:userId" element={<HomePage />} />
          <Route path="/settings" element={<Navigate to="/settings/notifications" replace />} />
          <Route path="/settings/notifications" element={<HomePage />} />
          <Route path="/settings/help" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
