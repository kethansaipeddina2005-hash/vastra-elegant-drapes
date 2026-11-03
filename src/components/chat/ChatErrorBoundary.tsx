import { Component, type ReactNode } from 'react';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** A failed optional chat chunk must never take down the storefront. */
class ChatErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Button
          variant="outline"
          className="fixed bottom-20 lg:bottom-6 right-4 z-50 shadow-lg gap-2"
          onClick={() => window.location.reload()}
          title="Reload the page to restore customer chat"
          aria-label="Reload to restore customer chat"
        >
          <MessageCircle className="h-4 w-4" />
          Reload chat
          <RefreshCw className="h-4 w-4" />
        </Button>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;