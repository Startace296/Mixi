import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'When you register, we collect your email address, nickname, date of birth and gender. We also collect usage data such as login times and message metadata (not message content) to improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'Your information is used to provide and improve ChatApp services, verify your identity, send important account notifications, and personalise your experience. We do not sell your personal data to any third party.',
  },
  {
    title: '3. Data Storage & Security',
    content: 'All data is stored on secure servers with industry-standard encryption. Passwords are hashed and never stored in plain text. We use HTTPS for all data in transit.',
  },
  {
    title: '4. Cookies',
    content: 'We use essential cookies to keep you logged in and remember your preferences. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but some features may not work correctly.',
  },
  {
    title: '5. Third-Party Services',
    content: 'ChatApp may integrate with third-party services such as Google Sign-In. These services have their own privacy policies. We are not responsible for how third parties handle your data.',
  },
  {
    title: '6. Your Rights',
    content: 'You have the right to access, correct or delete your personal data at any time through your account settings. You may also request a full export of your data by contacting our support team.',
  },
  {
    title: '7. Children\'s Privacy',
    content: 'ChatApp is not intended for users under the age of 13. If we become aware that a child under 13 has registered, we will promptly delete their account and associated data.',
  },
  {
    title: '8. Changes to This Policy',
    content: 'We may update these policies from time to time. When we do, we will notify you via email or an in-app notice. Continued use of ChatApp after changes constitutes your acceptance of the updated policy.',
  },
];

function Policies() {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <div className="info-content">
        <div className="info-logo" onClick={() => navigate('/login')}>
          <Logo />
        </div>

        <div className="info-hero">
          <h1 className="info-hero-title">Privacy <span className="highlight">Policies</span></h1>
          <p className="info-hero-sub">Last updated: February 2026</p>
        </div>

        <div className="policies-intro">
          <p>At ChatApp, we value your privacy. This policy explains what data we collect, how we use it, and the choices you have. Please read it carefully.</p>
        </div>

        <div className="policies-sections">
          {SECTIONS.map((s, i) => (
            <div key={i} className="policies-section">
              <h3>{s.title}</h3>
              <p>{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Policies;
