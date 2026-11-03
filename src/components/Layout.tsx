import { ReactNode, lazy, Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import DeferUntilIdle from './DeferUntilIdle';
import ChatErrorBoundary from './chat/ChatErrorBoundary';

// Chat is a non-critical widget — keep it out of the initial bundle/render.
const CustomerChat = lazy(() => import('./chat/CustomerChat'));

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      <Footer className="hidden lg:block" />
      <DeferUntilIdle>
        <ChatErrorBoundary>
          <Suspense fallback={null}>
            <CustomerChat />
          </Suspense>
        </ChatErrorBoundary>
      </DeferUntilIdle>
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
