import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '917997909061';
  const message = encodeURIComponent('Hi! I have a query about Vastra sarees.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-36 lg:bottom-[5.5rem] right-4 z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200"
    >
      <MessageCircle className="h-7 w-7 fill-white" />
    </a>
  );
};

export default WhatsAppButton;
