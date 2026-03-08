import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/auth-comp/Footer';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'test@example.com';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleConfirm = (e) => {
    e.preventDefault();
    if (code.length !== 6 || !email) return;
    navigate('/register', { state: { email } });
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    setTimeLeft(60);
    console.log('Resend code to', email);
  };

  return (
    <div className="auth-box-page auth-box-page--short">
      <div className="auth-box-wrapper">
        <div className="auth-box-scroll">
          <div className="auth-box">
            <h2 className="auth-title">Verify your email</h2>
            <p className="auth-sub">We sent a 6-digit code to your email</p>
            <form className="auth-form" onSubmit={handleConfirm} noValidate>
              <div className="form-group">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder=" "
                  maxLength={6}
                  required
                  className="code-input"
                />
                <label className="form-label">Verification code</label>
              </div>
              <div className="verify-actions">
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleResend}
                  disabled={timeLeft > 0}
                >
                  Resend code
                </button>
                {timeLeft > 0 ? (
                  <span className="verify-timer">Code expired in {timeLeft}s</span>
                ) : null}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={code.length !== 6 || timeLeft <= 0}
              >
                Confirm
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
