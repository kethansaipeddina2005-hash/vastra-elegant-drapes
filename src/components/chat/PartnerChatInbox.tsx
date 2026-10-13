import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ChatImage from './ChatImage';
import type { Tables } from '@/integrations/supabase/types';

type Thread = { id: string; customer_name: string; product_id: number; product_name: string; product_code: string; product_image: string; subject: string; status: string; updated_at: string; last_message: string; unread_count: number };

export default function PartnerChatInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Tables<'chat_messages'>[]>([]);
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const thread = threads.find(t => t.id === selected);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('partner_chat_inbox');
    if (error) toast.error('Could not load product chats');
    else setThreads(data || []);
    setLoading(false);
  }, []);

  const readMessages = useCallback(async () => {
    if (!selected) return;
    const version = ++request.current;
    const { data, error } = await supabase.from('chat_messages').select('*').eq('conversation_id', selected).order('created_at');
    if (version !== request.current) return;
    if (error) { toast.error('Could not load messages'); return; }
    setMessages(data || []);
    await supabase.rpc('mark_product_chat_read', { _conversation_id: selected });
    setThreads(prev => prev.map(t => t.id === selected ? { ...t, unread_count: 0 } : t));
  }, [selected]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const channel = supabase.channel(`partner-inbox-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => refresh()).subscribe();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
    return () => { clearInterval(timer); supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  useEffect(() => {
    setMessages([]); setDraft(''); setFiles([]);
    if (!selected) return;
    readMessages();
    const channel = supabase.channel(`partner-thread-${selected}`).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selected}` }, () => readMessages()).subscribe();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') readMessages(); }, 15000);
    return () => { request.current++; clearInterval(timer); supabase.removeChannel(channel); };
  }, [selected, readMessages]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selected || sending || (!draft.trim() && !files.length) || thread?.status === 'closed') return;
    setSending(true);
    try {
      const images: string[] = [];
      for (const file of files) {
        const path = `${user.id}/${selected}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
        const { error } = await supabase.storage.from('chat-images').upload(path, file);
        if (error) throw error;
        images.push(path);
      }
      const { error } = await supabase.from('chat_messages').insert({ conversation_id: selected, sender_id: user.id, sender_type: 'partner', message: draft.trim() || '📷 Sent images', images });
      if (error) throw error;
      setDraft(''); setFiles([]);
      await readMessages(); await refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.message.includes('phone numbers') ? 'Please keep replies to product details, without phone numbers or Instagram IDs.' : 'Reply could not be sent. Please try again.');
    } finally { setSending(false); }
  };

  return <section aria-label="Customer product chats" className="flex h-[620px] max-h-[80vh] min-h-[400px] border border-border rounded-lg overflow-hidden bg-card">
    <aside className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 flex-col border-r border-border`}>
      <div className="p-4 border-b border-border flex justify-between items-center"><h2 className="font-playfair text-xl">Customer chats</h2><Badge variant="secondary">{threads.reduce((sum, t) => sum + t.unread_count, 0)}</Badge></div>
      <div className="overflow-y-auto flex-1">
        {loading ? <div className="m-4 h-28 rounded bg-muted animate-pulse" /> : !threads.length ? <p className="p-6 text-sm text-muted-foreground">No customer product queries yet.</p> : threads.map(t => <Button key={t.id} variant="ghost" onClick={() => setSelected(t.id)} className={`h-auto w-full justify-start whitespace-normal rounded-none p-4 border-b border-border text-left ${selected === t.id ? 'bg-muted' : ''}`}>
          <div className="w-full min-w-0"><div className="flex justify-between gap-2"><span className="font-medium truncate">{t.customer_name}</span>{t.unread_count > 0 && <Badge>{t.unread_count}</Badge>}</div><p className="text-sm truncate mt-1">{t.product_name}</p><p className="text-xs text-muted-foreground truncate mt-1">{t.last_message || t.subject}</p><p className="text-xs text-muted-foreground mt-1 capitalize">{t.status}</p></div>
        </Button>)}
      </div>
    </aside>
    <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
      {thread ? <>
        <header className="flex items-center gap-3 p-4 border-b border-border">
          <Button size="icon" variant="ghost" aria-label="Back to conversations" className="md:hidden shrink-0" onClick={() => setSelected(null)}><ArrowLeft className="h-4 w-4" /></Button>
          {thread.product_image && <img src={thread.product_image} alt={thread.product_name} className="h-12 w-12 object-cover rounded shrink-0" />}
          <div className="min-w-0"><h3 className="font-medium break-words">{thread.customer_name}</h3><Link to={`/product/${thread.product_id}`} className="text-sm text-muted-foreground break-words">{thread.product_code} · {thread.product_name}</Link></div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
          {messages.map(m => <div key={m.id} className={`w-fit max-w-[85%] rounded-lg px-3 py-2 break-words ${m.sender_type === 'partner' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
            <p className="text-xs opacity-70 mb-1">{m.sender_type === 'partner' ? 'You · Partner' : m.sender_type === 'admin' ? 'Vastra Team' : thread.customer_name}</p>
            {!!m.images?.length && <div className="flex flex-wrap gap-2 mb-2">{m.images.map(src => <ChatImage key={src} src={src} alt="Chat attachment" className="w-20 h-20 rounded object-cover" />)}</div>}
            <p className="text-sm whitespace-pre-wrap">{m.message}</p><p className="text-[10px] opacity-70 mt-1">{new Date(m.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>)}<div ref={bottom} />
        </div>
        <form onSubmit={send} className="p-3 border-t border-border space-y-2">
          {files.length > 0 && <div className="flex items-center justify-between gap-2 text-xs"><span>{files.length} image(s) attached</span><Button type="button" size="sm" variant="ghost" onClick={() => setFiles([])}>Remove</Button></div>}
          {thread.status === 'closed' ? <p className="text-sm text-muted-foreground">This conversation is closed.</p> : <div className="flex gap-2">
            <label title="Attach images" aria-label="Attach images" className="flex h-10 w-10 shrink-0 items-center justify-center cursor-pointer rounded border border-border" onTouchStart={e => e.stopPropagation()}><ImagePlus className="h-4 w-4" /><input type="file" accept="image/*" multiple className="hidden" disabled={sending} onChange={e => { const chosen = Array.from(e.target.files || []); if (chosen.some(f => f.size > 10 * 1024 * 1024 || !f.type.startsWith('image/'))) toast.error('Choose images smaller than 10 MB'); else setFiles(chosen.slice(0, 3)); e.target.value = ''; }} /></label>
            <Input aria-label="Reply to customer" placeholder="Your reply…" maxLength={4000} value={draft} onChange={e => setDraft(e.target.value)} disabled={sending} className="min-w-0" />
            <Button type="submit" size="icon" aria-label="Send reply" disabled={sending || (!draft.trim() && !files.length)} className="shrink-0"><Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} /></Button>
          </div>}
        </form>
      </> : <div className="m-auto text-center text-muted-foreground"><MessageCircle className="h-10 w-10 mx-auto mb-3" /><p>Select a customer conversation</p></div>}
    </div>
  </section>;
}