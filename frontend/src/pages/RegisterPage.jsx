import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Footer from '../components/auth-comp/Footer';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 76 }, (_, i) => 2025 - i);
const GENDERS = ['Male', 'Female', 'Other'];

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [signature, setSignature] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'test@example.com';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword || !nickname || !gender || !day || !month || !year) return;
    console.log('Create account:', { email, nickname, gender, day, month, year, password });
  };

  return (
    <div className="auth-box-page">
      <div className="auth-box-wrapper">
        <div className="auth-box-scroll">
          <div className="auth-box register-form">
            <h2 className="auth-title">Create account</h2>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  readOnly
                  placeholder=" "
                  className="input-readonly"
                />
                <label className="form-label">Email</label>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="form-label">Nickname</label>
              </div>
              <div className="form-group">
                <textarea
                  value={signature}
                  onChange={(e) => { if (e.target.value.length <= 200) setSignature(e.target.value); }}
                  placeholder="Say something about yourself... (Signature)"
                  className="signature-input"
                  rows={3}
                />
                <span className="signature-counter">{signature.length}/200</span>
              </div>
              <div className="form-group">
                <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                  <option value="">Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group birth-row">
                <select value={day} onChange={(e) => setDay(e.target.value)} required>
                  <option value="">Day</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={month} onChange={(e) => setMonth(e.target.value)} required>
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select value={year} onChange={(e) => setYear(e.target.value)} required>
                  <option value="">Year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="form-label">Password</label>
              </div>
              <div className="form-group">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="form-label">Confirm password</label>
              </div>
              <button type="submit" className="btn-primary">Create Account</button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
