import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import CustomerChat from './chat/CustomerChat';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CustomerChat />
    </div>
  );
};

export default Layout;
