import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FitCheckSlideProps {
  sareeImageUrl: string;
  sareeName: string;
  className?: string;
}

const FitCheckSlide = ({ sareeImageUrl, sareeName, className }: FitCheckSlideProps) => {
  const { user } = useAuth();
  const [fitCheckPhoto, setFitCheckPhoto] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user has a fit check photo
  const checkProfilePhoto = async () => {
    if (!user || profileChecked) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("fit_check_photo")
        .eq("id", user.id)
        .single();

      if (data?.fit_check_photo) {
        setFitCheckPhoto(data.fit_check_photo);
      }
      setProfileChecked(true);
    } catch (err) {
      console.error("Error checking profile:", err);
      setProfileChecked(true);
    }
  };

  // Upload photo directly from the gallery
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/fit-check.${fileExt}`;

      const { error } = await supabase.storage
        .from("fit-check-photos")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("fit-check-photos")
        .getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from("profiles").update({ fit_check_photo: url }).eq("id", user.id);

      setFitCheckPhoto(url);
      toast({ title: "✨ Photo uploaded!", description: "Now tap 'Try It On' to see the magic" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Generate virtual try-on
  const handleTryOn = async () => {
    if (!fitCheckPhoto) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("virtual-tryon", {
        body: {
          userPhotoUrl: fitCheckPhoto,
          sareeImageUrl,
          sareeName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.image);
      toast({ title: "✨ Virtual Try-On Ready!", description: "Here's how you'd look in this saree" });
    } catch (err: any) {
      console.error("Try-on error:", err);
      toast({
        title: "Try-on failed",
        description: err.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lazy check profile on first render
  if (user && !profileChecked) {
    checkProfilePhoto();
  }

  // If generated image exists, show it
  if (generatedImage) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-4", className)}>
        <img
          src={generatedImage}
          alt={`You in ${sareeName}`}
          className="max-h-[80%] max-w-full object-contain rounded-lg shadow-lg"
        />
        <p className="mt-2 text-xs text-muted-foreground text-center">
          ✨ AI-Generated Virtual Try-On
        </p>
        <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => setGeneratedImage(null)}>
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 gap-4", className)}>
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Creating your look...</p>
          <p className="text-xs text-muted-foreground mt-1">Our AI stylist is draping this saree on you</p>
        </div>
      </div>
    );
  }

  // No user logged in
  if (!user) {
    return (
      <div
        className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-6 gap-4", className)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <Sparkles className="h-10 w-10 text-primary/40" />
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">Virtual Try-On</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in and upload your photo to see how this saree looks on you
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => window.location.href = "/account/login"}>
          Sign In
        </Button>
      </div>
    );
  }

  // User has photo — show try-on CTA
  if (fitCheckPhoto) {
    return (
      <div
        className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-6 gap-4", className)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
            <img src={fitCheckPhoto} alt="Your Style Avatar" className="h-full w-full object-cover" />
          </div>
          <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">See Yourself In This Saree</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI will drape <span className="font-medium">{sareeName}</span> on your photo
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs bg-gradient-to-r from-primary to-primary/80"
          onClick={handleTryOn}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Try It On
        </Button>
      </div>
    );
  }

  // No photo — upload prompt
  return (
    <div
      className={cn("w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-6 gap-4", className)}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleUpload}
        className="hidden"
      />
      <Camera className="h-10 w-10 text-primary/40" />
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Virtual Try-On</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload your photo to see how this saree looks on you
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        disabled={uploading}
      >
        <Upload className="h-3.5 w-3.5 mr-1.5" />
        {uploading ? "Uploading..." : "Upload Your Photo"}
      </Button>
    </div>
  );
};

export default FitCheckSlide;
