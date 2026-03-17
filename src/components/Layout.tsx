import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import CustomerChat from './chat/CustomerChat';
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <Footer className="hidden lg:block" />
      <CustomerChat />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
