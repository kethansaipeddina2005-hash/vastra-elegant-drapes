import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ImagePlus, XCircle } from 'lucide-react';
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
  images?: string[];
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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
 
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 3 images
    const newFiles = files.slice(0, 3 - selectedImages.length);
    setSelectedImages((prev) => [...prev, ...newFiles]);

    // Create preview URLs
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !conversation || !user) return;

    setSending(true);
    try {
      // Upload images first if any
      const imageUrls = await uploadImages();

      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: 'customer',
        message: newMessage.trim() || (imageUrls.length > 0 ? '📷 Sent images' : ''),
        images: imageUrls.length > 0 ? imageUrls : null,
      });

      if (error) throw error;
      setNewMessage('');
      setSelectedImages([]);
      setImagePreviewUrls([]);
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
 
  const handleOpenChat = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to start a chat.',
      });
      return;
    }
    setIsOpen(true);
  };
 
   return (
     <>
       {/* Chat Button */}
        <Button
          onClick={handleOpenChat}
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
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {msg.images.map((img, idx) => (
                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                              <img
                                src={img}
                                alt={`Attachment ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded border border-border/50 hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.message && msg.message !== '📷 Sent images' && <p>{msg.message}</p>}
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
            <div className="border-t border-border p-3 space-y-2">
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imagePreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-12 h-12 object-cover rounded border border-border" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || loading || selectedImages.length >= 3}
                  className="shrink-0"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending || loading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sending || uploadingImages || (!newMessage.trim() && selectedImages.length === 0)} 
                  size="icon"
                >
                  {sending || uploadingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
       )}
     </>
   );
 };
 
 export default CustomerChat;