import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Mail, MailOpen, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (isAdmin) fetchMessages();
  }, [isAdmin, adminLoading]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load messages');
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (msg: ContactMessage) => {
    if (msg.is_read) return;
    await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
  };

  const handleView = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    markAsRead(msg);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete message');
    } else {
      setMessages(prev => prev.filter(m => m.id !== id));
      toast.success('Message deleted');
      if (selectedMessage?.id === id) setSelectedMessage(null);
    }
  };

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (adminLoading || loading) {
    return <Layout><div className="flex justify-center items-center min-h-screen"><Loading /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No messages found.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => (
              <Card key={msg.id} className={`cursor-pointer transition-colors ${!msg.is_read ? 'border-primary bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {msg.is_read ? (
                    <MailOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0" onClick={() => handleView(msg)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold truncate ${!msg.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground">&lt;{msg.email}&gt;</span>
                    </div>
                    <p className={`text-sm truncate ${!msg.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => handleView(msg)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(msg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-semibold">From:</span> {selectedMessage.name}</div>
                  <div><span className="font-semibold">Email:</span> {selectedMessage.email}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {format(new Date(selectedMessage.created_at), 'dd MMM yyyy, hh:mm a')}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {selectedMessage.message}
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                      Reply via Email
                    </a>
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(selectedMessage.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminMessages;
