import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate loading completion after a minimum time
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        onLoadingComplete?.();
      }, 600); // Match fade-out duration
    }, 1500); // Show for at least 1.5s

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10 transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 -m-8 animate-[pulse_2s_ease-in-out_infinite]">
          <div className="w-full h-full rounded-full bg-primary/20 blur-2xl" />
        </div>
        
        {/* Main circle container */}
        <div className="relative w-40 h-40 rounded-full bg-white shadow-2xl shadow-primary/30 flex items-center justify-center">
          {/* Rotating logo */}
          <div className="animate-[spin_3s_linear_infinite]">
            <img
              src={logo}
              alt="Vastra Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>

        {/* Subtle ring animation */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
      </div>

      {/* Loading text */}
      <p className="absolute bottom-20 text-sm text-muted-foreground font-poppins animate-pulse">
        Loading elegance...
      </p>
    </div>
  );
};

export default LoadingScreen;
