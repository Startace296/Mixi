import { useState } from 'react';

export function AboutUsPage() {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1c1e21] leading-tight mb-3">
          About <span className="text-indigo-600">ChatApp</span>
        </h1>
        <p className="text-lg text-[#606770]">
          Connecting people, one message at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        <div className="bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="text-3xl mb-3">💬</div>
          <h3 className="text-lg font-bold text-[#1c1e21] mb-2.5">
            Our mission
          </h3>
          <p className="text-[15px] text-[#606770] leading-relaxed">
            ChatApp was built with a simple goal — to make communication feel
            natural, fast and secure for everyone. Whether you're catching up
            with friends or collaborating with teammates, we've got you covered.
          </p>
        </div>
        <div className="bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-lg font-bold text-[#1c1e21] mb-2.5">
            Our story
          </h3>
          <p className="text-[15px] text-[#606770] leading-relaxed">
            Founded in 2026 by a small team of passionate developers, ChatApp
            started as a university project and grew into a platform used by
            thousands. We believe great communication starts with great tools.
          </p>
        </div>
        <div className="bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-[#1c1e21] mb-2.5">
            Privacy first
          </h3>
          <p className="text-[15px] text-[#606770] leading-relaxed">
            We take your privacy seriously. All messages are encrypted and
            your data is never sold to third parties. You control what you
            share, always.
          </p>
        </div>
        <div className="bg-white rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="text-3xl mb-3">🌍</div>
          <h3 className="text-lg font-bold text-[#1c1e21] mb-2.5">
            Global community
          </h3>
          <p className="text-[15px] text-[#606770] leading-relaxed">
            With users across dozens of countries, ChatApp brings people
            together across borders and time zones. Join our growing community
            today.
          </p>
        </div>
      </div>

      <div className="text-center mb-14">
        <h2 className="text-2xl font-bold text-[#1c1e21] mb-7">
          Meet the team
        </h2>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xl font-bold">
              HL
            </div>
            <p className="text-[15px] font-semibold text-[#1c1e21]">
              Hoang Lam
            </p>
            <p className="text-[13px] text-[#606770]">Leader</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xl font-bold">
              HL
            </div>
            <p className="text-[15px] font-semibold text-[#1c1e21]">
              Hoang Long
            </p>
            <p className="text-[13px] text-[#606770]">Co-Leader</p>
          </div>
        </div>
      </div>
    </>
  );
}

const FAQS = [
  {
    q: 'How do I create an account?',
    a: "Click \"Sign up\" on the login page, enter your email address and follow the verification steps. You'll receive a 6-digit code in your inbox.",
  },
  {
    q: "I didn't receive the verification code. What should I do?",
    a: 'Check your spam or junk folder. If it\'s not there, wait 60 seconds and use the "Resend code" button on the verification page.',
  },
  {
    q: 'How do I change my password?',
    a: "Go to your profile settings and select \"Change password\". You'll need to enter your current password before setting a new one.",
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

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1c1e21] leading-tight mb-3">
          Help <span className="text-indigo-600">Center</span>
        </h1>
        <p className="text-lg text-[#606770]">
          Find answers to the most common questions below.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-14">
        {FAQS.map((item, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl px-6 py-5 cursor-pointer transition-shadow duration-150 shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_3px_10px_rgba(0,0,0,0.1)] ${
              openIndex === i ? 'shadow-[0_3px_10px_rgba(79,70,229,0.15)]' : ''
            }`}
            onClick={() => toggle(i)}
          >
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-[#1c1e21]">
                {item.q}
              </span>
              <span className="text-[15px] text-indigo-600 flex-shrink-0 ml-4">
                {openIndex === i ? '▲' : '▼'}
              </span>
            </div>
            {openIndex === i && (
              <p className="mt-3 text-[15px] text-[#606770] leading-relaxed">
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="py-10 px-6 md:px-8 bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.07)] mb-4">
        <h2 className="text-[22px] font-bold text-[#1c1e21] mb-2.5 text-center">
          Still need help?
        </h2>
        <p className="text-[15px] text-[#606770] mb-6 text-center">
          Our support team is available Monday – Friday, 9am – 6pm.
        </p>
        <p className="text-[15px] font-semibold text-[#606770] mb-3 text-left">
          Contact us at:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="space-y-2">
            <p className="text-[15px] text-[#1c1e21]">
              <span className="text-[#606770]">Email:</span> nhoanglam2309@gmail.com
            </p>
            <p className="text-[15px] text-[#1c1e21]">
              <span className="text-[#606770]">Phone:</span> 0911876754
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[15px] text-[#1c1e21]">
              <span className="text-[#606770]">Address:</span> 1, Vo Van Ngan Street, Linh Chung, Thu Duc, Ho Chi Minh City
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'When you register, we collect your email address, nickname, date of birth and gender. We also collect usage data such as login times and message metadata (not message content) to improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'Your information is used to provide and improve ChatApp services, verify your identity, send important account notifications, and personalise your experience. We do not sell your personal data to any third party.',
  },
  {
    title: '3. Data Storage & Security',
    content:
      'All data is stored on secure servers with industry-standard encryption. Passwords are hashed and never stored in plain text. We use HTTPS for all data in transit.',
  },
  {
    title: '4. Cookies',
    content:
      'We use essential cookies to keep you logged in and remember your preferences. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but some features may not work correctly.',
  },
  {
    title: '5. Third-Party Services',
    content:
      'ChatApp may integrate with third-party services such as Google Sign-In. These services have their own privacy policies. We are not responsible for how third parties handle your data.',
  },
  {
    title: '6. Your Rights',
    content:
      'You have the right to access, correct or delete your personal data at any time through your account settings. You may also request a full export of your data by contacting our support team.',
  },
  {
    title: "7. Children's Privacy",
    content:
      "ChatApp is not intended for users under the age of 13. If we become aware that a child under 13 has registered, we will promptly delete their account and associated data.",
  },
  {
    title: '8. Changes to This Policy',
    content:
      'We may update these policies from time to time. When we do, we will notify you via email or an in-app notice. Continued use of ChatApp after changes constitutes your acceptance of the updated policy.',
  },
];

export function PoliciesPage() {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1c1e21] leading-tight mb-3">
          Privacy <span className="text-indigo-600">Policies</span>
        </h1>
        <p className="text-lg text-[#606770]">Last updated: 15th, February 2026</p>
      </div>

      <div className="bg-white rounded-xl px-7 py-6 mb-7 shadow-[0_1px_4px_rgba(0,0,0,0.07)] text-[15px] text-[#606770] leading-relaxed">
        <p>
          At ChatApp, we value your privacy. This policy explains what data we
          collect, how we use it, and the choices you have. Please read it
          carefully.
        </p>
      </div>

      <div className="flex flex-col gap-5 mb-14">
        {SECTIONS.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-xl px-7 py-6 shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
          >
            <h3 className="text-base font-bold text-[#1c1e21] mb-2.5">
              {s.title}
            </h3>
            <p className="text-[15px] text-[#606770] leading-[1.7]">
              {s.content}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
