import { useState, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FitCheckUploadProps {
  userId: string;
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string) => void;
  variant?: "compact" | "full";
  className?: string;
}

const FitCheckUpload = ({ userId, currentPhotoUrl, onPhotoUploaded, variant = "full", className }: FitCheckUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/fit-check.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("fit-check-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("fit-check-photos")
        .getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ fit_check_photo: url })
        .eq("id", userId);

      setPreview(url);
      onPhotoUploaded(url);
      toast({ title: "✨ Photo uploaded!", description: "Your Style Avatar is ready for virtual try-ons" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ fit_check_photo: null })
        .eq("id", userId);

      if (error) throw error;

      setPreview(null);
      onPhotoUploaded("");
      toast({ title: "Photo removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      id={inputId}
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      className="sr-only"
    />
  );

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2", className)}>
        {fileInput}
        {preview ? (
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/30">
              <img src={preview} alt="Style Avatar" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Style Avatar Active</p>
              <p className="text-xs text-muted-foreground">Virtual try-on enabled</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="h-7 w-7 p-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className={cn(
              "flex items-center justify-center gap-1.5 w-full text-xs h-8 rounded-md border border-input bg-background px-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload Style Avatar"}
          </label>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {fileInput}
      
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Style Avatar</p>
          <p className="text-xs text-muted-foreground">
            Upload your photo to virtually try on sarees — completely optional
          </p>
        </div>
      </div>

      {preview ? (
        <div className="relative group">
          <div className="h-40 w-40 mx-auto rounded-xl overflow-hidden border-2 border-primary/20 shadow-md">
            <img src={preview} alt="Style Avatar" className="h-full w-full object-cover" />
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <label
              htmlFor={inputId}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 h-8 text-xs font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                uploading && "pointer-events-none opacity-50"
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              Change
            </label>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-destructive">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          <Camera className="h-8 w-8 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            {uploading ? "Uploading..." : "Tap to upload your photo"}
          </span>
        </label>
      )}
    </div>
  );
};

export default FitCheckUpload;