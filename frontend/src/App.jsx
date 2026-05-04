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
import AuthCallbackPage from './pages/AuthCallbackPage';
import { AboutUsPage, HelpPage, PoliciesPage } from './pages/InfoPages';
import HomePage from './pages/HomePage';
import { APP_PATHS } from './lib/appPaths';

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
        <Route path={APP_PATHS.signUp} element={<SignUpPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path={APP_PATHS.register} element={<Navigate to={APP_PATHS.signUp} replace />} />
        <Route path={APP_PATHS.authCallback} element={<Navigate to={APP_PATHS.authCallbackGoogle} replace />} />
        <Route path="/auth/callback/:provider" element={<AuthCallbackPage />} />
        <Route element={<InfoLayout />}>
          <Route path="about" element={<AboutUsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="policies" element={<PoliciesPage />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path={APP_PATHS.home} element={<HomePage />} />
          <Route path={APP_PATHS.friends} element={<Navigate to={APP_PATHS.friendsRequests} replace />} />
          <Route path={APP_PATHS.friendsRequests} element={<HomePage />} />
          <Route path={APP_PATHS.friendsAll} element={<HomePage />} />
          <Route
            path={APP_PATHS.messages}
            element={<HomePage />}
          />
          <Route path="/messages/:threadId" element={<HomePage />} />
          <Route path={APP_PATHS.profile} element={<HomePage />} />
          <Route path="/profile/:userId" element={<HomePage />} />
          <Route path={APP_PATHS.settings} element={<Navigate to={APP_PATHS.settingsAccount} replace />} />
          <Route path={APP_PATHS.settingsAccount} element={<HomePage />} />
          <Route path="*" element={<Navigate to={APP_PATHS.home} replace />} />
        </Route>
        <Route path="/" element={<Navigate to={APP_PATHS.login} replace />} />
        <Route path="*" element={<Navigate to={APP_PATHS.login} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
