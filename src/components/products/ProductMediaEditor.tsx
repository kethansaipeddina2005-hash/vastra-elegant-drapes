import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
export default function ProductMediaEditor({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const urls: string[] = [];
    try { for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { toast.error('Choose images under 10 MB'); continue; }
      const path = `admin/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error(error.message); continue; }
      urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl);
    } onChange([...images, ...urls]); } finally { setUploading(false); }
  };
  return <div className="space-y-3"><div className="flex flex-wrap gap-3">{images.map((url,index) => <div key={`${url}-${index}`} className="relative"><img src={url} alt={`Product image ${index+1}`} className="h-20 w-16 object-cover rounded" /><Button type="button" size="icon" variant="destructive" aria-label={`Remove image ${index+1}`} className="absolute -top-2 -right-2 h-6 w-6" onClick={() => onChange(images.filter((_,i) => i!==index))}><X className="h-3 w-3" /></Button></div>)}</div><label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground"><Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload photos'}<input type="file" className="hidden" multiple accept="image/*" disabled={uploading} onChange={e => { upload(e.target.files); e.target.value=''; }} /></label></div>;
}
