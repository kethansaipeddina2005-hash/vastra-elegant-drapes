interface WhatsAppButtonProps {
  productName: string;
  productPrice: number;
  productUrl: string;
}

const WhatsAppButton = ({ productName, productPrice, productUrl }: WhatsAppButtonProps) => {
  const phoneNumber = '917997909061';
  const message = encodeURIComponent(
    `Hi! I'm interested in this saree:\n\n` +
    `🛍️ *${productName}*\n` +
    `💰 Price: ₹${productPrice.toLocaleString('en-IN')}\n` +
    `🔗 ${productUrl}\n\n` +
    `Please share more details.`
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp about this product"
      className="fixed bottom-36 lg:bottom-24 right-4 z-50 flex items-center justify-center h-12 w-12 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform duration-200"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.312 22.594c-.39 1.1-1.932 2.014-3.178 2.28-.852.18-1.964.324-5.71-1.228-4.796-1.986-7.882-6.842-8.122-7.16-.23-.318-1.932-2.572-1.932-4.904 0-2.332 1.222-3.476 1.656-3.954.39-.432.912-.606 1.222-.606.152 0 .286.008.41.014.432.018.648.044.934.722.358.846 1.222 2.918 1.33 3.13.11.212.222.498.084.794-.128.302-.236.438-.448.692-.212.254-.412.448-.624.72-.194.236-.412.488-.172.934.24.446 1.066 1.758 2.29 2.848 1.574 1.402 2.9 1.836 3.312 2.038.318.152.696.128.944-.134.318-.338.71-.898 1.11-1.45.284-.394.644-.446.996-.298.358.14 2.264 1.068 2.652 1.262.39.196.648.29.744.456.094.164.094.95-.296 2.044z"/>
      </svg>
    </a>
  );
};

export default WhatsAppButton;
