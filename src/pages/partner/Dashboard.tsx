import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { usePartner } from "@/hooks/usePartner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, ShoppingBag } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type OrderItem = Tables<"order_items"> & { orders?: { order_number: string | null; status: string; created_at: string } | null };

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  fabric_type: "",
  color: "",
  occasion: "",
  region: "",
  images: "",
};

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { partner, isPartner, loading } = usePartner();
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState<Record<number, any>>({});
  const [sales, setSales] = useState<any[]>([]);
  const pct = Number((partner as any)?.commission_percentage ?? 10);

  useEffect(() => {
    if (!loading && !isPartner) navigate("/become-a-partner");
    if (isPartner) load();
  }, [isPartner, loading]);

  const load = async () => {
    if (!partner) return;
    const [{ data: prods }, { data: items }] = await Promise.all([
      supabase.from("products").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }),
      supabase.from("order_items").select("*, orders(order_number, status, created_at)").order("created_at", { ascending: false }),
    ]);
    setProducts(prods || []);
    const [{ data: pr }, { data: sl }] = await Promise.all([
      supabase.from("partner_product_pricing").select("*").eq("partner_id", partner.id),
      supabase.from("partner_sales").select("*").eq("partner_id", partner.id),
    ]);
    setPricing(Object.fromEntries((pr || []).map((r: any) => [r.product_id, r])));
    setSales(sl || []);
    const myIds = new Set((prods || []).map((p) => p.id));
    setOrderItems(((items as OrderItem[]) || []).filter((i) => myIds.has(i.product_id)));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    if (!form.name.trim() || !form.price) return toast.error("Name and price are required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Math.round(parseFloat(form.price) * (1 + pct / 100) * 100) / 100,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      fabric_type: form.fabric_type.trim() || null,
      color: form.color.trim() || null,
      occasion: form.occasion.trim() || null,
      region: form.region.trim() || null,
      images: form.images.trim() ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : null,
      partner_id: partner.id,
    };
    const { data: saved, error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    if (!error && saved) {
      await supabase.rpc("set_partner_base_price", { _product_id: saved.id, _base: parseFloat(form.price) });
    }
    setSaving(false);
    if (error) return toast.error("Could not save product");
    toast.success(editing ? "Product updated" : "Product added");
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    load();
  };

  const edit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(pricing[p.id]?.partner_base_price ?? p.price),
      stock_quantity: String(p.stock_quantity ?? 0),
      fabric_type: p.fabric_type || "",
      color: p.color || "",
      occasion: p.occasion || "",
      region: p.region || "",
      images: (p.images || []).join(", "),
    });
    setEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    load();
  };

  if (loading || !isPartner || !partner) return null;

  const totalSales = sales.length
    ? sales.reduce((s, i) => s + Number(i.partner_earnings), 0)
    : orderItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const basePreview = parseFloat(form.price) || 0;
  const commPreview = Math.round(basePreview * pct) / 100;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Partner Portal</p>
        <h1 className="font-playfair text-3xl md:text-4xl mb-1">{partner.brand_name}</h1>
        <p className="text-muted-foreground mb-8">Signed in as {user?.email}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="border border-border rounded-lg p-4 bg-card">
            <Package className="h-5 w-5 text-accent mb-2" />
            <p className="text-2xl font-semibold">{products.length}</p>
            <p className="text-sm text-muted-foreground">Products listed</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <ShoppingBag className="h-5 w-5 text-accent mb-2" />
            <p className="text-2xl font-semibold">{orderItems.reduce((s, i) => s + i.quantity, 0)}</p>
            <p className="text-sm text-muted-foreground">Items sold</p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card col-span-2 md:col-span-1">
            <p className="text-2xl font-semibold">₹{totalSales.toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">Your earnings</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button size="sm" variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")}>My Products</Button>
          <Button size="sm" variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>Orders ({orderItems.length})</Button>
        </div>

        {tab === "products" && (
          <>
            {!showForm ? (
              <Button onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(true); }} className="mb-6">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            ) : (
              <form onSubmit={save} className="border border-border rounded-lg p-6 bg-card grid md:grid-cols-2 gap-4 mb-8">
                <h2 className="md:col-span-2 font-playfair text-xl">{editing ? "Edit Product" : "Add Product"}</h2>
                <div>
                  <Label>Product Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Your Base Price (₹) *</Label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5" />
                  {basePreview > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                      <p>Vastra commission ({pct}%): ₹{commPreview.toLocaleString("en-IN")}</p>
                      <p>Customer final price: <span className="text-foreground font-medium">₹{(basePreview + commPreview).toLocaleString("en-IN")}</span></p>
                      <p>Your earnings per sale: <span className="text-foreground font-medium">₹{basePreview.toLocaleString("en-IN")}</span></p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Fabric Type</Label>
                  <Input value={form.fabric_type} onChange={(e) => setForm({ ...form, fabric_type: e.target.value })} className="mt-1.5" placeholder="Silk, Cotton…" />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1.5" />
                </div>
                <div>
                  <Label>Occasion</Label>
                  <Input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="mt-1.5" placeholder="Wedding, Festive…" />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="mt-1.5" placeholder="Banarasi, Kanjivaram…" />
                </div>
                <div>
                  <Label>Image URLs (comma separated)</Label>
                  <Input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="mt-1.5" placeholder="https://…, https://…" />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}</Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
                </div>
              </form>
            )}

            {products.length === 0 ? (
              <p className="text-muted-foreground">No products yet. Add your first product above.</p>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="border border-border rounded-lg p-4 bg-card flex flex-wrap items-center gap-4">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-14 h-14 object-cover rounded" />}
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {pricing[p.id]
                          ? `Base ₹${Number(pricing[p.id].partner_base_price).toLocaleString("en-IN")} + ${pricing[p.id].commission_percentage}% (₹${Number(pricing[p.id].commission_amount).toLocaleString("en-IN")}) = Customer ₹${Number(pricing[p.id].customer_final_price).toLocaleString("en-IN")} · You earn ₹${Number(pricing[p.id].partner_earnings).toLocaleString("en-IN")}`
                          : `₹${Number(p.price).toLocaleString("en-IN")}`} · Stock: {p.stock_quantity ?? 0}
                        {p.product_code && ` · ${p.product_code}`}
                      </p>
                    </div>
                    {(p.stock_quantity ?? 0) === 0 && <Badge variant="destructive">Out of stock</Badge>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => edit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          orderItems.length === 0 ? (
            <p className="text-muted-foreground">No orders for your products yet.</p>
          ) : (
            <div className="space-y-3">
              {orderItems.map((i) => {
                const prod = products.find((p) => p.id === i.product_id);
                return (
                  <div key={i.id} className="border border-border rounded-lg p-4 bg-card flex flex-wrap items-center gap-4">
                    {prod?.images?.[0] && <img src={prod.images[0]} alt={prod.name} className="w-14 h-14 object-cover rounded" />}
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold">{prod?.name || `Product #${i.product_id}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {i.orders?.order_number || "Order"} · Qty {i.quantity} · ₹{(Number(i.price) * i.quantity).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-muted-foreground">{i.orders?.created_at ? new Date(i.orders.created_at).toLocaleDateString() : ""}</p>
                    </div>
                    {i.orders?.status && <Badge variant="secondary">{i.orders.status}</Badge>}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </Layout>
  );
};

export default PartnerDashboard;
