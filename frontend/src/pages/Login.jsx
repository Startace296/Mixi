import { useState } from 'react';
import Logo from '../components/Logo';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login with:', { email, password });
  };

  return (
    <div className="auth-page">
      <div className="auth-graphic">
        <Logo />
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
              placeholder="Email address"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <button type="submit" className="btn-primary">Log in</button>
          <a href="#" className="forgot-password">Forgotten password?</a>
          <div className="divider"></div>
          <button type="button" className="btn-secondary">Create new account</button>
        </form>
      </div>
    </div>
  );
}

export default Login;