import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/auth-comp/Logo';
import Footer from '../components/auth-comp/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login with:', { email, password });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page">
        <div className="auth-graphic">
          <Logo />
          <img src="/graphic.jpg" alt="" className="auth-graphic-img" />
          <h1 className="graphic-title">
            Stay connected with <span className="highlight">life</span>
          </h1>
        </div>
        <div className="auth-form-container">
          <h2 className="auth-title">Log in to ChatApp</h2>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
              />
              <label className="form-label">Email address or phone number</label>
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
            <button type="submit" className="btn-primary">Log in</button>
            <a href="#" className="forgot-password">Forgotten password?</a>
            <div className="divider"></div>
            <button type="button" className="btn-secondary" onClick={() => navigate('/signup')}>Create new account</button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
