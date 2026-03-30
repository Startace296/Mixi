import { Footer } from './AuthSiteChrome';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#f0f2f5] p-5">
      <div className="flex flex-col items-center flex-1">
        <div className="w-full flex justify-center pt-6 pb-10">
          <div className="w-full max-w-[540px] flex-shrink-0 bg-white rounded-lg p-10 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)]">
            <h2 className="text-2xl font-bold text-center text-[#1c1e21] mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-[#606770] text-center mb-10">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
