import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import VerifyPage from './pages/VerifyPage';
import RegisterPage from './pages/RegisterPage';
import AboutUsPage from './pages/AboutUsPage';
import HelpPage from './pages/HelpPage';
import PoliciesPage from './pages/PoliciesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
