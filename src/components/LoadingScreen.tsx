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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f5f5dc] transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 -m-4 animate-[pulse_2s_ease-in-out_infinite]">
          <div className="w-full h-full rounded-full bg-primary/10 blur-xl" />
        </div>
        
        {/* Main circle container */}
        <div className="relative w-20 h-20 rounded-full bg-white shadow-lg shadow-primary/20 flex items-center justify-center">
          <img
            src={logo}
            alt="Vastra Logo"
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Subtle ring animation */}
        <div className="absolute inset-0 rounded-full border border-primary/20 animate-[ping_2s_ease-in-out_infinite]" />
      </div>

      {/* Loading text */}
      <p className="mt-6 text-sm text-muted-foreground font-poppins animate-pulse">
        Loading elegance...
      </p>
    </div>
  );
};

export default LoadingScreen;
