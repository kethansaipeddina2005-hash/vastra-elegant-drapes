import { Sparkles } from "lucide-react";

const ScarcityRibbon = () => {
  return (
    <section className="relative bg-background border-y border-primary/10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-24 h-24 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium">
              Limited Edition
            </span>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>

          <div className="h-px w-12 bg-primary/20 hidden sm:block" />

          <div className="max-w-2xl">
            <h2 className="font-playfair text-lg sm:text-xl md:text-2xl text-foreground font-semibold text-balance mb-1">
              Only 50 Exclusive Silk Sarees Per Collection
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-light text-pretty">
              Every design is released only once. Once sold out, it is never restocked.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScarcityRibbon;
