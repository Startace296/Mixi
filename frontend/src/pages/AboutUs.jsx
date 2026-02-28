import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <div className="info-content">
        <div className="info-logo" onClick={() => navigate('/login')}>
          <Logo />
        </div>

        <div className="info-hero">
          <h1 className="info-hero-title">About <span className="highlight">ChatApp</span></h1>
          <p className="info-hero-sub">Connecting people, one message at a time.</p>
        </div>

        <div className="info-section-grid">
          <div className="info-card">
            <div className="info-card-icon">💬</div>
            <h3>Our mission</h3>
            <p>ChatApp was built with a simple goal — to make communication feel natural, fast and secure for everyone. Whether you're catching up with friends or collaborating with teammates, we've got you covered.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🚀</div>
            <h3>Our story</h3>
            <p>Founded in 2026 by a small team of passionate developers, ChatApp started as a university project and grew into a platform used by thousands. We believe great communication starts with great tools.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🔒</div>
            <h3>Privacy first</h3>
            <p>We take your privacy seriously. All messages are encrypted and your data is never sold to third parties. You control what you share, always.</p>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🌍</div>
            <h3>Global community</h3>
            <p>With users across dozens of countries, ChatApp brings people together across borders and time zones. Join our growing community today.</p>
          </div>
        </div>

        <div className="info-team">
          <h2>Meet the team</h2>
          <div className="info-team-grid">
            <div className="info-team-card">
              <div className="info-avatar">HL</div>
              <p className="info-name">Hoang Lam</p>
              <p className="info-role">Leader</p>
            </div>
            <div className="info-team-card">
              <div className="info-avatar">HL</div>
              <p className="info-name">Hoang Long</p>
              <p className="info-role">Co-Leader</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default AboutUs;
