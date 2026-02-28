import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

function SignUp() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    navigate('/verify', { state: { email: email.trim() } });
  };

  return (
    <div className="auth-box-page auth-box-page--short">
      <div className="auth-box-wrapper">
        <div className="auth-box-scroll">
          <div className="auth-box">
            <h2 className="auth-title">Sign up</h2>
            <form className="auth-form" onSubmit={handleVerify} noValidate>
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                <label className="form-label">Email address</label>
              </div>
              <p className="auth-helper">
                Already have an account?{' '}
                <button type="button" className="btn-link" onClick={() => navigate('/login')}>
                  Login
                </button>
              </p>
              <button type="submit" className="btn-primary">Verify</button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default SignUp;
