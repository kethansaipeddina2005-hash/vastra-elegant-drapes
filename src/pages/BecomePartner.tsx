import { useState } from "react";
import { z } from "zod";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const schema = z.object({
  brand_name: z.string().trim().min(1, "Brand name is required").max(150),
  owner_name: z.string().trim().min(1, "Owner name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[+\d\s-]{8,20}$/, "Enter a valid phone number"),
  instagram: opt(100),
  website: opt(255),
  location: z.string().trim().min(1, "Location is required").max(150),
  business_category: z.string().trim().min(1, "Category is required").max(100),
  products_sold: opt(500),
  business_description: z.string().trim().min(20, "Please describe your business (min 20 characters)").max(3000),
  why_partner: opt(2000),
  catalogue_url: opt(500),
  expected_products: opt(10),
  shipping_info: opt(1000),
  return_policy: opt(1000),
  gst_info: opt(100),
  logo_url: opt(500),
  additional_notes: opt(2000),
});

type Form = z.infer<typeof schema>;
const empty = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, ""])) as Form;

const fields: { key: keyof Form; label: string; area?: boolean; required?: boolean; placeholder?: string }[] = [
  { key: "brand_name", label: "Boutique / Brand Name", required: true },
  { key: "owner_name", label: "Owner Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "instagram", label: "Instagram ID", placeholder: "@yourboutique" },
  { key: "website", label: "Website" },
  { key: "location", label: "Location", required: true, placeholder: "City, State" },
  { key: "business_category", label: "Business Category", required: true, placeholder: "Sarees, Jewellery, Lehengas…" },
  { key: "products_sold", label: "Products / Categories You Sell" },
  { key: "expected_products", label: "Expected Number of Products" },
  { key: "catalogue_url", label: "Catalogue / Portfolio Link", placeholder: "Google Drive, PDF or Instagram link" },
  { key: "logo_url", label: "Logo Link" },
  { key: "gst_info", label: "GST / Business Registration (if applicable)" },
  { key: "business_description", label: "Business Description", area: true, required: true },
  { key: "why_partner", label: "Why partner with Vastra Luxe?", area: true },
  { key: "shipping_info", label: "Shipping Information", area: true },
  { key: "return_policy", label: "Return Policy", area: true },
  { key: "additional_notes", label: "Additional Notes", area: true },
];

const BecomePartner = () => {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      toast.error("Please check the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);
    const d = parsed.data;
    const clean = (v?: string) => (v && v.length ? v : null);
    const { error } = await supabase.from("partner_applications").insert({
      brand_name: d.brand_name, owner_name: d.owner_name, email: d.email, phone: d.phone,
      location: d.location, business_category: d.business_category, business_description: d.business_description,
      instagram: clean(d.instagram), website: clean(d.website), products_sold: clean(d.products_sold),
      why_partner: clean(d.why_partner), catalogue_url: clean(d.catalogue_url),
      expected_products: d.expected_products ? parseInt(d.expected_products) || null : null,
      shipping_info: clean(d.shipping_info), return_policy: clean(d.return_policy),
      gst_info: clean(d.gst_info), logo_url: clean(d.logo_url), additional_notes: clean(d.additional_notes),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit your application. Please try again.");
      return;
    }
    setDone(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">Vastra Luxe Partner Program</p>
        <h1 className="font-playfair text-3xl md:text-5xl mb-4">Apply to Become a Vastra Luxe Partner</h1>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          We invite select boutiques, designers and brands to showcase their craft to women who value
          authenticity and luxury. Every application is personally reviewed by our team — approved partners
          receive their own Partner Portal to manage products and orders.
        </p>

        {done ? (
          <div className="border border-accent/40 rounded-lg p-8 bg-card">
            <CheckCircle2 className="h-10 w-10 text-accent mb-4" />
            <h2 className="font-playfair text-2xl mb-2">Thank you for applying</h2>
            <p className="text-muted-foreground">
              Your application has been received and is pending review. Our team will contact you by email.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-5 border border-border rounded-lg p-6 bg-card">
            {fields.map((f) => (
              <div key={f.key} className={f.area ? "md:col-span-2" : ""}>
                <Label htmlFor={f.key}>{f.label}{f.required && " *"}</Label>
                {f.area ? (
                  <Textarea id={f.key} rows={3} value={form[f.key] ?? ""} placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1.5" />
                ) : (
                  <Input id={f.key} value={form[f.key] ?? ""} placeholder={f.placeholder}
                    type={f.key === "email" ? "email" : f.key === "expected_products" ? "number" : "text"}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-1.5" />
                )}
                {errors[f.key] && <p className="text-destructive text-xs mt-1">{errors[f.key]}</p>}
              </div>
            ))}
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto px-10">
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default BecomePartner;
