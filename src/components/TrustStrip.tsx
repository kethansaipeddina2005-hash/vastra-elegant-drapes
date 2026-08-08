import { Globe, Video, ShieldCheck, Gift, MessageCircle, Headphones } from "lucide-react";

const ITEMS = [
  { icon: Gift, title: "Premium Packaging", copy: "Every saree arrives gift-ready" },
  { icon: Globe, title: "Worldwide Delivery", copy: "Tracked shipping to 30+ countries" },
  { icon: ShieldCheck, title: "Secure Checkout", copy: "Encrypted, trusted payments" },
  { icon: Video, title: "Video Call Shopping", copy: "See the drape live before you buy" },
  { icon: MessageCircle, title: "WhatsApp Assistance", copy: "Personal styling on chat" },
  { icon: Headphones, title: "Easy Support", copy: "Real people, quick replies" },
];

const TrustStrip = () => (
  <section aria-label="Why shop with Vastra Luxe" className="border-y border-border/60 bg-muted/20">
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6">
        {ITEMS.map(({ icon: Icon, title, copy }) => (
          <div key={title} className="flex flex-col gap-1.5">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{copy}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustStrip;