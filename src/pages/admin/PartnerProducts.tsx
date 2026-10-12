import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import ProductMediaEditor from '@/components/products/ProductMediaEditor';
import SizeChartEditor from '@/components/products/SizeChartEditor';
import { emptySizeChart, parseSizeChart, validateSizeChart } from '@/lib/sizing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const FILTERS = ["pending", "approved", "rejected", "all"] as const;

const PartnerProducts = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<number, any>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", stock: "", base: "" });
  const [commissionType, setCommissionType] = useState('partner_default');
  const [commissionValue, setCommissionValue] = useState('');
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [paymentOptions, setPaymentOptions] = useState('both');
  const [sizeChart, setSizeChart] = useState(emptySizeChart);
  const [sizingEnabled, setSizingEnabled] = useState(false);
  const startEdit = (p: any) => {
    setEditing(p.id);
    setCommissionType(pricing[p.id]?.commission_type || 'partner_default');
    setCommissionValue(String(pricing[p.id]?.commission_value ?? ''));
    setImages(p.images || []); setPaymentOptions(p.payment_options || "both");
    setSizingEnabled(p.sizing_enabled); setSizeChart(parseSizeChart(p.size_chart));
    setForm({ name: p.name, description: p.description || "", stock: String(p.stock_quantity ?? 0), base: String(pricing[p.id]?.partner_base_price ?? "") });
  };

  const saveEdit = async (id: number) => {
    const base = Number(form.base);
    const value = Number(commissionValue);
    if (!Number.isFinite(base) || base <= 0) return toast.error('Enter a valid partner base price');
    if (commissionType !== 'partner_default' && (!commissionValue.trim() || !Number.isFinite(value) || value < 0 || (commissionType === 'percentage' && value > 100))) return toast.error('Enter a valid commission');
    if (sizingEnabled) { const issue = validateSizeChart(sizeChart); if (issue) return toast.error(issue); }
    setSaving(true);
    try {
    const { error } = await supabase.from("products").update({
      images, payment_options: paymentOptions, sizing_enabled: sizingEnabled, size_chart: JSON.parse(JSON.stringify(sizeChart)), 
      name: form.name.trim(), description: form.description.trim() || null, stock_quantity: parseInt(form.stock) || 0,
    }).eq("id", id);
    if (error) return toast.error("Update failed");
    const { error: pe } = await supabase.rpc('set_product_commission', { _product_id: id, _base: base, _type: commissionType, _value: commissionType === 'partner_default' ? null : value });
    if (pe) return toast.error(pe.message);
    toast.success("Product updated");
    setEditing(null);
    load();
    } finally { setSaving(false); }
  };

  const removeProduct = async (id: number) => {
    if (!confirm("Delete this partner product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("Delete failed — it may be part of existing orders");
    toast.success("Product deleted");
    load();
  };

  useEffect(() => {
    if (!loading && !isAdmin) navigate("/");
    if (isAdmin) load();
  }, [isAdmin, loading]);

  const load = async () => {
    const [{ data, error }, { data: pr }] = await Promise.all([
      supabase.from("products").select("*, partner_applications(brand_name)").not("partner_id", "is", null).order("updated_at", { ascending: false }),
      supabase.from("partner_product_pricing").select("*"),
    ]);
    if (error) return toast.error("Failed to load partner products");
    setItems(data || []);
    setPricing(Object.fromEntries((pr || []).map((r: any) => [r.product_id, r])));
  };

  const decide = async (id: number, status: "approved" | "rejected") => {
    const { error } = await supabase.from("products").update({
      approval_status: status, approval_notes: notes[id] ?? items.find(p => p.id === id)?.approval_notes ?? null }).eq("id", id);
    if (error) return toast.error("Update failed");
    toast.success(status === "approved" ? "Product is now live" : "Product rejected");
    load();
  };

  if (loading || !isAdmin) return null;
  const shown = items.filter((p) => filter === "all" || p.approval_status === filter);
  const inr = (n: any) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-playfair text-3xl mb-1">Partner Product Approval</h1>
        <p className="text-muted-foreground mb-6">Partner products stay hidden from customers until you approve them. Any partner edit sends the product back for review.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f[0].toUpperCase() + f.slice(1)} ({f === "all" ? items.length : items.filter((p) => p.approval_status === f).length})
            </Button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="text-muted-foreground">Nothing here.</p>
        ) : (
          <div className="space-y-3">
            {shown.map((p) => {
              const pr = pricing[p.id];
              return (
                <div key={p.id} className="border border-border rounded-lg p-4 bg-card flex flex-wrap gap-4 items-start">
                  {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-20 h-24 object-cover rounded" />}
                  <div className="flex-1 min-w-[220px] space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{p.name}</p>
                      <Badge variant={p.approval_status === "approved" ? "default" : p.approval_status === "rejected" ? "destructive" : "secondary"}>{p.approval_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.partner_applications?.brand_name} · Stock {p.stock_quantity ?? 0}{p.fabric_type ? ` · ${p.fabric_type}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{p.payment_options === 'online' ? 'Online only (Razorpay)' : p.payment_options === 'cod' ? 'Cash on Delivery only' : 'Online & Cash on Delivery'}</p>
                    <p className="text-sm">
                      {pr
                        ? `Base ${inr(pr.partner_base_price)} + ${pr.commission_type === 'fixed' ? `Fixed ${inr(pr.commission_amount)}` : `${pr.commission_percentage}% (${inr(pr.commission_amount)})`} = Customer ${inr(pr.customer_final_price)}`
                        : `Customer price ${inr(p.price)}`}
                    </p>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    {editing === p.id && (
                      <div className="grid md:grid-cols-2 gap-2 mt-2 max-w-2xl">
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                        <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock" />
                        <Input type="number" value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="Partner base price (₹)" />
                        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Commission type</p>
                          <Select value={commissionType} onValueChange={setCommissionType}><SelectTrigger aria-label="Commission type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="partner_default">Partner default percentage</SelectItem><SelectItem value="percentage">Product percentage</SelectItem><SelectItem value="fixed">Fixed amount (₹)</SelectItem></SelectContent></Select>
                        </div>
                        {commissionType !== 'partner_default' && <div className="space-y-1"><p className="text-sm font-medium">{commissionType === 'fixed' ? 'Commission per item (₹)' : 'Commission (%)'}</p><Input aria-label="Commission value" type="number" min="0" max={commissionType === 'percentage' ? 100 : undefined} step="0.01" value={commissionValue} onChange={e => setCommissionValue(e.target.value)} /></div>}
                        {commissionType !== 'partner_default' && <p className="md:col-span-2 text-sm text-muted-foreground">Partner earns {inr(Number(form.base) || 0)} · Vastra earns {inr(commissionType === 'fixed' ? Number(commissionValue) || 0 : (Number(form.base) || 0) * (Number(commissionValue) || 0) / 100)} per item · Customer price {inr((Number(form.base) || 0) + (commissionType === 'fixed' ? Number(commissionValue) || 0 : (Number(form.base) || 0) * (Number(commissionValue) || 0) / 100))}</p>}
                         <div className="md:col-span-2"><ProductMediaEditor images={images} onChange={setImages} /></div>
                         <Select value={paymentOptions} onValueChange={setPaymentOptions}><SelectTrigger aria-label="Payment methods"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="both">Online & COD</SelectItem><SelectItem value="online">Online only</SelectItem><SelectItem value="cod">COD only</SelectItem></SelectContent></Select>
                         <div className="md:col-span-2"><SizeChartEditor admin enabled={sizingEnabled} chart={sizeChart} categoryId={p.category_id} onChange={(enabled, chart) => { setSizingEnabled(enabled); setSizeChart(chart); }} /></div>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={saving} onClick={() => saveEdit(p.id)}>{saving ? 'Saving…' : 'Save'}</Button>
                          <Button size="sm" disabled={saving} variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    <Input placeholder="Note to partner (optional)" className="mt-2 max-w-md"
                      value={notes[p.id] ?? p.approval_notes ?? ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.approval_status !== "approved" && <Button size="sm" onClick={() => decide(p.id, "approved")}>Approve</Button>}
                    {p.approval_status !== "rejected" && <Button size="sm" variant="outline" onClick={() => decide(p.id, "rejected")}>Reject</Button>}
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => removeProduct(p.id)}>Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PartnerProducts;
