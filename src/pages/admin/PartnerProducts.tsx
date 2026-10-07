import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const FILTERS = ["pending", "approved", "rejected", "all"] as const;

const PartnerProducts = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [items, setItems] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<number, any>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [notes, setNotes] = useState<Record<number, string>>({});

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
    const { error } = await supabase.from("products").update({ approval_status: status, approval_notes: notes[id] || null }).eq("id", id);
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
                    <p className="text-sm">
                      {pr
                        ? `Base ${inr(pr.partner_base_price)} + ${pr.commission_percentage}% (${inr(pr.commission_amount)}) = Customer ${inr(pr.customer_final_price)}`
                        : `Customer price ${inr(p.price)}`}
                    </p>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                    <Input placeholder="Note to partner (optional)" className="mt-2 max-w-md"
                      value={notes[p.id] ?? p.approval_notes ?? ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    {p.approval_status !== "approved" && <Button size="sm" onClick={() => decide(p.id, "approved")}>Approve</Button>}
                    {p.approval_status !== "rejected" && <Button size="sm" variant="outline" onClick={() => decide(p.id, "rejected")}>Reject</Button>}
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
