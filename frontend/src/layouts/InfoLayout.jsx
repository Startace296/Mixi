import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '../components/auth-comp/AuthSiteChrome';

export default function InfoLayout() {
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#f0f2f5]">
      <Navbar />
      <main className="flex-1 max-w-[860px] w-full mx-auto px-6 py-12 pt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
