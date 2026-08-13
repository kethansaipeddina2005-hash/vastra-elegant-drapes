import { Globe, Video, ShieldCheck, Gift, MessageCircle, Headphones } from "lucide-react";

const ITEMS = [
  { icon: Gift, main: "Premium", sub: "Packaging" },
  { icon: Globe, main: "Worldwide", sub: "Delivery" },
  { icon: ShieldCheck, main: "Secure", sub: "Checkout" },
  { icon: Video, main: "Video Call", sub: "Shopping" },
  { icon: MessageCircle, main: "WhatsApp", sub: "Assistance" },
  { icon: Headphones, main: "Easy", sub: "Support" },
];

const TrustStrip = () => (
  <section aria-label="Why shop with Vastra Luxe" className="relative border-y border-primary/20 bg-background/80 overflow-hidden">
    {/* Decorative background pattern */}
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 0l12 12-12 12L0 12 12 0z' fill='none' stroke='%23d4af37' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: "24px 24px",
      }}
    />

    {/* Ornamental corner borders */}
    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/40" aria-hidden="true" />
    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-primary/40" aria-hidden="true" />
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-primary/40" aria-hidden="true" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/40" aria-hidden="true" />

    <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-6">
        {ITEMS.map(({ icon: Icon, main, sub }) => (
          <div
            key={main + sub}
            className="flex flex-col items-center text-center group cursor-default"
          >
            <div className="relative mb-4 md:mb-5">
              <div className="absolute inset-0 scale-150 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500" />
              <Icon
                className="w-8 h-8 md:w-10 md:h-10 text-primary relative"
                strokeWidth={1}
                aria-hidden="true"
              />
            </div>
            <h3 className="font-playfair text-sm md:text-base tracking-widest uppercase text-foreground mb-0.5">
              {main}
            </h3>
            <p className="text-[10px] md:text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              {sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustStrip;
