import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/auth-comp/Logo';
import Footer from '../components/auth-comp/Footer';

const FAQS = [
  {
    q: 'How do I create an account?',
    a: 'Click "Sign up" on the login page, enter your email address and follow the verification steps. You\'ll receive a 6-digit code in your inbox.',
  },
  {
    q: 'I didn\'t receive the verification code. What should I do?',
    a: 'Check your spam or junk folder. If it\'s not there, wait 60 seconds and use the "Resend code" button on the verification page.',
  },
  {
    q: 'How do I change my password?',
    a: 'Go to your profile settings and select "Change password". You\'ll need to enter your current password before setting a new one.',
  },
  {
    q: 'Can I delete my account?',
    a: 'Yes. Go to Settings → Account → Delete Account. Note that this action is permanent and all your data will be removed.',
  },
  {
    q: 'Is ChatApp free to use?',
    a: 'Yes, ChatApp is completely free. We may introduce optional premium features in the future, but core messaging will always be free.',
  },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="info-page">
      <div className="info-content">
        <div className="info-logo" onClick={() => navigate('/login')}>
          <Logo />
        </div>

        <div className="info-hero">
          <h1 className="info-hero-title">Help <span className="highlight">Center</span></h1>
          <p className="info-hero-sub">Find answers to the most common questions below.</p>
        </div>

        <div className="info-faq">
          {FAQS.map((item, i) => (
            <div key={i} className={`faq-item${openIndex === i ? ' open' : ''}`} onClick={() => toggle(i)}>
              <div className="faq-question">
                <span>{item.q}</span>
                <span className="faq-icon">{openIndex === i ? '▲' : '▼'}</span>
              </div>
              {openIndex === i && <p className="faq-answer">{item.a}</p>}
            </div>
          ))}
        </div>

        <div className="info-contact">
          <h2>Still need help?</h2>
          <p>Our support team is available Monday – Friday, 9am – 6pm.</p>
          <a href="mailto:support@chatapp.com" className="btn-primary info-contact-btn">Contact Support</a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
