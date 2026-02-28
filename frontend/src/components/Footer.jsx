import { useNavigate } from 'react-router-dom';

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="auth-footer">
      <div className="auth-footer-divider"></div>
      <div className="auth-footer-links">
        <span></span>
        <span className="auth-footer-link" onClick={() => navigate('/about')}>About us</span>
        <span className="auth-footer-link" onClick={() => navigate('/policies')}>Policies</span>
        <span className="auth-footer-link" onClick={() => navigate('/help')}>Helps</span>
        <span></span>
      </div>
      <p className="auth-footer-copy">© 2026 ChatApp. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
