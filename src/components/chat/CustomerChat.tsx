 import { useState, useEffect, useRef } from 'react';
 import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useToast } from '@/hooks/use-toast';
 import { cn } from '@/lib/utils';
 
interface Message {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

interface Conversation {
  id: string;
  status: string | null;
}
 
 interface CustomerChatProps {
   productId?: number;
   productName?: string;
 }
 
 const CustomerChat = ({ productId, productName }: CustomerChatProps) => {
   const [isOpen, setIsOpen] = useState(false);
   const [messages, setMessages] = useState<Message[]>([]);
   const [newMessage, setNewMessage] = useState('');
   const [conversation, setConversation] = useState<Conversation | null>(null);
   const [loading, setLoading] = useState(false);
   const [sending, setSending] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const { user } = useAuth();
   const { toast } = useToast();
 
   useEffect(() => {
     if (isOpen && user) {
       loadOrCreateConversation();
     }
   }, [isOpen, user]);
 
   useEffect(() => {
     if (!conversation) return;
 
     const channel = supabase
       .channel(`chat-${conversation.id}`)
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'chat_messages',
           filter: `conversation_id=eq.${conversation.id}`,
         },
         (payload) => {
           const newMsg = payload.new as Message;
           setMessages((prev) => [...prev, newMsg]);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [conversation]);
 
   useEffect(() => {
     scrollToBottom();
   }, [messages]);
 
   const scrollToBottom = () => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   };
 
   const loadOrCreateConversation = async () => {
     if (!user) return;
     setLoading(true);
 
     try {
       // Try to find existing open conversation
       const { data: existingConv } = await supabase
         .from('conversations')
         .select('*')
         .eq('customer_id', user.id)
         .eq('status', 'open')
         .maybeSingle();
 
       if (existingConv) {
         setConversation(existingConv);
         await loadMessages(existingConv.id);
       } else {
         // Create new conversation
         const { data: newConv, error } = await supabase
           .from('conversations')
           .insert({
             customer_id: user.id,
             customer_name: user.user_metadata?.full_name || user.email,
             customer_email: user.email,
             product_id: productId || null,
             subject: productName ? `Customization for ${productName}` : 'Saree Customization',
           })
           .select()
           .single();
 
         if (error) throw error;
         setConversation(newConv);
       }
     } catch (error) {
       console.error('Error loading conversation:', error);
       toast({
         title: 'Error',
         description: 'Failed to load chat. Please try again.',
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
 
     setMessages(data || []);
   };
 
   const sendMessage = async () => {
     if (!newMessage.trim() || !conversation || !user) return;
 
     setSending(true);
     try {
       const { error } = await supabase.from('chat_messages').insert({
         conversation_id: conversation.id,
         sender_id: user.id,
         sender_type: 'customer',
         message: newMessage.trim(),
       });
 
       if (error) throw error;
       setNewMessage('');
     } catch (error) {
       console.error('Error sending message:', error);
       toast({
         title: 'Error',
         description: 'Failed to send message. Please try again.',
         variant: 'destructive',
       });
     } finally {
       setSending(false);
     }
   };
 
   const handleKeyPress = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       sendMessage();
     }
   };
 
   if (!user) {
     return null;
   }
 
   return (
     <>
       {/* Chat Button */}
       <Button
         onClick={() => setIsOpen(true)}
         className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
         size="icon"
       >
         <MessageCircle className="h-6 w-6" />
       </Button>
 
       {/* Chat Window */}
       {isOpen && (
         <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card shadow-xl">
           {/* Header */}
           <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 rounded-t-lg">
             <div>
               <h3 className="font-semibold text-primary-foreground">Customize Your Saree</h3>
               <p className="text-xs text-primary-foreground/80">Chat with our team</p>
             </div>
             <Button
               variant="ghost"
               size="icon"
               onClick={() => setIsOpen(false)}
               className="text-primary-foreground hover:bg-primary-foreground/10"
             >
               <X className="h-5 w-5" />
             </Button>
           </div>
 
           {/* Messages */}
           <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
             {loading ? (
               <div className="flex h-full items-center justify-center">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
               </div>
             ) : messages.length === 0 ? (
               <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                 <MessageCircle className="mb-2 h-12 w-12 opacity-50" />
                 <p className="text-sm">Start a conversation!</p>
                 <p className="text-xs mt-1">Tell us how you'd like to customize your saree.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {messages.map((msg) => (
                   <div
                     key={msg.id}
                     className={cn(
                       'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                       msg.sender_type === 'customer'
                         ? 'ml-auto bg-primary text-primary-foreground'
                         : 'bg-muted text-foreground'
                     )}
                   >
                     <p>{msg.message}</p>
                     <p className={cn(
                       "text-[10px] mt-1",
                       msg.sender_type === 'customer' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                     )}>
                       {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                 ))}
               </div>
             )}
           </ScrollArea>
 
           {/* Input */}
           <div className="border-t border-border p-3">
             <div className="flex gap-2">
               <Input
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 onKeyPress={handleKeyPress}
                 placeholder="Type your message..."
                 disabled={sending || loading}
                 className="flex-1"
               />
               <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                 {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
               </Button>
             </div>
           </div>
         </div>
       )}
     </>
   );
 };
 
 export default CustomerChat;