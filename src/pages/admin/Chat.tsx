 import { useState, useEffect, useRef } from 'react';
 import { Send, Loader2, User, MessageCircle, Circle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Badge } from '@/components/ui/badge';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useAdmin } from '@/hooks/useAdmin';
 import { useToast } from '@/hooks/use-toast';
 import { cn } from '@/lib/utils';
 import { Navigate, Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
 import { 
   LayoutDashboard, 
   Package, 
   ShoppingCart, 
   Users, 
   Image, 
   Ticket, 
   CreditCard, 
   FolderOpen,
   Mail,
   Shield,
   Menu,
   X
 } from 'lucide-react';
 
type Message = Tables<'chat_messages'>;
 
interface Conversation extends Tables<'conversations'> {
   unread_count?: number;
   last_message?: string;
 }
 
 const menuItems = [
   { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
   { icon: Package, label: 'Products', path: '/admin/products' },
   { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
   { icon: Users, label: 'Customers', path: '/admin/customers' },
   { icon: Image, label: 'Banners', path: '/admin/banners' },
   { icon: Ticket, label: 'Coupons', path: '/admin/coupons' },
   { icon: Shield, label: 'Users & Roles', path: '/admin/users' },
   { icon: CreditCard, label: 'Payments', path: '/admin/payments' },
   { icon: FolderOpen, label: 'Categories', path: '/admin/categories' },
   { icon: Mail, label: 'Subscriptions', path: '/admin/subscriptions' },
   { icon: MessageCircle, label: 'Chat', path: '/admin/chat' },
 ];
 
 const AdminChat = () => {
   const [conversations, setConversations] = useState<Conversation[]>([]);
   const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
   const [messages, setMessages] = useState<Message[]>([]);
   const [newMessage, setNewMessage] = useState('');
   const [loading, setLoading] = useState(true);
   const [sending, setSending] = useState(false);
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const { user } = useAuth();
   const { isAdmin, loading: adminLoading } = useAdmin();
   const { toast } = useToast();
 
   useEffect(() => {
     if (isAdmin) {
       loadConversations();
     }
   }, [isAdmin]);
 
   useEffect(() => {
     if (selectedConversation) {
       loadMessages(selectedConversation.id);
       markMessagesAsRead(selectedConversation.id);
     }
   }, [selectedConversation]);
 
   useEffect(() => {
     if (!selectedConversation) return;
 
     const channel = supabase
       .channel(`admin-chat-${selectedConversation.id}`)
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'chat_messages',
           filter: `conversation_id=eq.${selectedConversation.id}`,
         },
         (payload) => {
           const newMsg = payload.new as Message;
           setMessages((prev) => [...prev, newMsg]);
           if (newMsg.sender_type === 'customer') {
             markMessagesAsRead(selectedConversation.id);
           }
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [selectedConversation]);
 
   useEffect(() => {
     scrollToBottom();
   }, [messages]);
 
   const scrollToBottom = () => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   };
 
   const loadConversations = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('conversations')
         .select('*')
         .order('updated_at', { ascending: false });
 
       if (error) throw error;
 
       // Get unread counts for each conversation
       const conversationsWithUnread = await Promise.all(
         (data || []).map(async (conv) => {
           const { count } = await supabase
             .from('chat_messages')
             .select('*', { count: 'exact', head: true })
             .eq('conversation_id', conv.id)
             .eq('sender_type', 'customer')
             .eq('is_read', false);
 
           const { data: lastMsg } = await supabase
             .from('chat_messages')
             .select('message')
             .eq('conversation_id', conv.id)
             .order('created_at', { ascending: false })
             .limit(1)
             .single();
 
           return {
             ...conv,
             unread_count: count || 0,
             last_message: lastMsg?.message || '',
           };
         })
       );
 
       setConversations(conversationsWithUnread);
     } catch (error) {
       console.error('Error loading conversations:', error);
       toast({
         title: 'Error',
         description: 'Failed to load conversations.',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
 
   const loadMessages = async (conversationId: string) => {
     const { data, error } = await supabase
       .from('chat_messages')
       .select('*')
       .eq('conversation_id', conversationId)
       .order('created_at', { ascending: true });
 
     if (error) {
       console.error('Error loading messages:', error);
       return;
     }
 
    setMessages(data as Message[]);
   };
 
   const markMessagesAsRead = async (conversationId: string) => {
     await supabase
       .from('chat_messages')
       .update({ is_read: true })
       .eq('conversation_id', conversationId)
       .eq('sender_type', 'customer')
       .eq('is_read', false);
   };
 
   const sendMessage = async () => {
     if (!newMessage.trim() || !selectedConversation || !user) return;
 
     setSending(true);
     try {
       const { error } = await supabase.from('chat_messages').insert({
         conversation_id: selectedConversation.id,
         sender_id: user.id,
         sender_type: 'admin',
         message: newMessage.trim(),
       });
 
       if (error) throw error;
 
       // Update conversation updated_at
       await supabase
         .from('conversations')
         .update({ updated_at: new Date().toISOString() })
         .eq('id', selectedConversation.id);
 
       setNewMessage('');
     } catch (error) {
       console.error('Error sending message:', error);
       toast({
         title: 'Error',
         description: 'Failed to send message.',
         variant: 'destructive',
       });
     } finally {
       setSending(false);
     }
   };
 
   const updateConversationStatus = async (status: string) => {
     if (!selectedConversation) return;
 
     try {
       await supabase
         .from('conversations')
         .update({ status })
         .eq('id', selectedConversation.id);
 
       setSelectedConversation({ ...selectedConversation, status });
       setConversations((prev) =>
         prev.map((c) => (c.id === selectedConversation.id ? { ...c, status } : c))
       );
 
       toast({
         title: 'Status Updated',
         description: `Conversation marked as ${status}.`,
       });
     } catch (error) {
       console.error('Error updating status:', error);
     }
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       sendMessage();
     }
   };
 
   if (adminLoading) {
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin" />
       </div>
     );
   }
 
   if (!isAdmin) {
     return <Navigate to="/account/login" replace />;
   }
 
   return (
     <div className="flex h-screen bg-background">
       {/* Sidebar */}
       <aside
         className={cn(
           'fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
           sidebarOpen ? 'translate-x-0' : '-translate-x-full'
         )}
       >
         <div className="flex h-16 items-center justify-between border-b border-border px-6">
           <h1 className="font-playfair text-xl font-semibold">Admin Panel</h1>
           <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
             <X className="h-5 w-5" />
           </Button>
         </div>
         <ScrollArea className="h-[calc(100vh-4rem)]">
           <nav className="space-y-1 p-4">
             {menuItems.map((item) => (
               <Link
                 key={item.path}
                 to={item.path}
                 className={cn(
                   'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                   item.path === '/admin/chat'
                     ? 'bg-primary text-primary-foreground'
                     : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                 )}
               >
                 <item.icon className="h-4 w-4" />
                 {item.label}
               </Link>
             ))}
           </nav>
         </ScrollArea>
       </aside>
 
       {/* Main Content */}
       <div className="flex flex-1 flex-col overflow-hidden">
         {/* Header */}
         <header className="flex h-16 items-center justify-between border-b border-border px-6">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
               <Menu className="h-5 w-5" />
             </Button>
             <h2 className="text-lg font-semibold">Customer Chat</h2>
           </div>
         </header>
 
         {/* Chat Interface */}
         <div className="flex flex-1 overflow-hidden">
           {/* Conversations List */}
           <div className="w-80 border-r border-border bg-card overflow-hidden flex flex-col">
             <div className="border-b border-border p-4">
               <h3 className="font-medium">Conversations</h3>
             </div>
             <ScrollArea className="flex-1">
               {loading ? (
                 <div className="flex items-center justify-center p-8">
                   <Loader2 className="h-6 w-6 animate-spin" />
                 </div>
               ) : conversations.length === 0 ? (
                 <div className="p-8 text-center text-muted-foreground">
                   <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-50" />
                   <p className="text-sm">No conversations yet</p>
                 </div>
               ) : (
                 <div className="space-y-1 p-2">
                   {conversations.map((conv) => (
                     <button
                       key={conv.id}
                       onClick={() => setSelectedConversation(conv)}
                       className={cn(
                         'w-full rounded-lg p-3 text-left transition-colors',
                         selectedConversation?.id === conv.id
                           ? 'bg-primary/10 border border-primary/20'
                           : 'hover:bg-muted'
                       )}
                     >
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-2">
                           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                             <User className="h-4 w-4 text-primary" />
                           </div>
                           <div>
                             <p className="text-sm font-medium">{conv.customer_name || 'Customer'}</p>
                             <p className="text-xs text-muted-foreground">{conv.customer_email}</p>
                           </div>
                         </div>
                         {(conv.unread_count || 0) > 0 && (
                           <Badge className="bg-primary">{conv.unread_count}</Badge>
                         )}
                       </div>
                       <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                         {conv.last_message || conv.subject}
                       </p>
                       <div className="mt-2 flex items-center gap-2">
                         <Circle
                           className={cn(
                             'h-2 w-2 fill-current',
                             conv.status === 'open' ? 'text-emerald-600' : conv.status === 'pending' ? 'text-amber-500' : 'text-muted-foreground'
                           )}
                         />
                         <span className="text-xs capitalize text-muted-foreground">{conv.status}</span>
                       </div>
                     </button>
                   ))}
                 </div>
               )}
             </ScrollArea>
           </div>
 
           {/* Chat Area */}
           <div className="flex flex-1 flex-col">
             {selectedConversation ? (
               <>
                 {/* Chat Header */}
                 <div className="flex items-center justify-between border-b border-border p-4">
                   <div>
                     <h3 className="font-medium">{selectedConversation.customer_name || 'Customer'}</h3>
                     <p className="text-sm text-muted-foreground">{selectedConversation.subject}</p>
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant={selectedConversation.status === 'open' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => updateConversationStatus('open')}
                     >
                       Open
                     </Button>
                     <Button
                       variant={selectedConversation.status === 'pending' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => updateConversationStatus('pending')}
                     >
                       Pending
                     </Button>
                     <Button
                       variant={selectedConversation.status === 'closed' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => updateConversationStatus('closed')}
                     >
                       Closed
                     </Button>
                   </div>
                 </div>
 
                 {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            msg.sender_type === 'admin'
                              ? 'ml-auto bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          )}
                        >
                          {/* Display Images */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.images.map((img, idx) => (
                                <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={img}
                                    alt={`Customer attachment ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded border border-border/50 hover:opacity-90 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                          {msg.message && msg.message !== '📷 Sent images' && <p className="text-sm">{msg.message}</p>}
                          <p
                            className={cn(
                              'text-xs mt-1',
                              msg.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      ))}
                   </div>
                 </ScrollArea>
 
                 {/* Input */}
                 <div className="border-t border-border p-4">
                   <div className="flex gap-2">
                     <Input
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                       onKeyPress={handleKeyPress}
                       placeholder="Type your reply..."
                       disabled={sending}
                       className="flex-1"
                     />
                     <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                       {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                     </Button>
                   </div>
                 </div>
               </>
             ) : (
               <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                 <MessageCircle className="mb-4 h-16 w-16 opacity-30" />
                 <p>Select a conversation to start chatting</p>
               </div>
             )}
           </div>
         </div>
       </div>
 
       {/* Overlay for mobile sidebar */}
       {sidebarOpen && (
         <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
       )}
     </div>
   );
 };
 
 export default AdminChat;