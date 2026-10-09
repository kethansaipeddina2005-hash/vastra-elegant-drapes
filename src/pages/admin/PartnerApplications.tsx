import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type App = Tables<"partner_applications">;
const STATUSES = ["pending", "under_review", "approved", "rejected", "on_hold", "info_requested"] as const;
const label = (s: string) => s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const PartnerApplications = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [apps, setApps] = useState<App[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pctEdit, setPctEdit] = useState<Record<string, string>>({});
  const [sales, setSales] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/");
    if (isAdmin) load();
  }, [isAdmin, adminLoading]);

  const load = async () => {
    const { data, error } = await supabase.from("partner_applications").select("*").order("created_at", { ascending: false });
    if (error) return toast.error("Failed to load applications");
    setApps(data || []);
    const [{ data: sl }, { data: pr }] = await Promise.all([
      supabase.from("partner_sales").select("*"),
      supabase.from("partner_product_pricing").select("*"),
    ]);
    setSales(sl || []);
    setPricing(pr || []);
  };

  const saveCommission = async (id: string) => {
    const v = parseFloat(pctEdit[id]);
    if (isNaN(v) || v < 0 || v > 100) return toast.error("Enter a percentage between 0 and 100");
    const { error } = await supabase.from("partner_applications").update({ commission_percentage: v }).eq("id", id);
    if (error) return toast.error("Update failed");
    // Reprice this partner's existing products with the new rate
    for (const r of pricing.filter((r) => r.partner_id === id)) {
      await supabase.rpc("set_partner_base_price", { _product_id: r.product_id, _base: Number(r.partner_base_price) });
    }
    toast.success("Commission updated and products repriced");
    load();
  };

  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

  const openFile = async (path: string) => {
    const { data, error } = await supabase.storage.from("partner-applications").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Could not open file");
    window.open(data.signedUrl, "_blank");
  };

  const update = async (id: string, patch: Partial<App>) => {
    const { error } = await supabase.from("partner_applications").update(patch).eq("id", id);
    if (error) return toast.error("Update failed");
    toast.success("Application updated");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this application permanently?")) return;
    const { error } = await supabase.from("partner_applications").delete().eq("id", id);
    if (error) return toast.error("Delete failed");
    load();
  };

  if (adminLoading || !isAdmin) return null;

  const shown = apps.filter((a) =>
    (filter === "all" || a.status === filter) &&
    [a.brand_name, a.owner_name, a.email, a.location].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const row = (k: string, v: any) => v ? (
    <div className="text-sm"><span className="text-muted-foreground">{k}: </span>
      {typeof v === "string" && /^https?:\/\//.test(v) ? <a href={v} target="_blank" rel="noreferrer" className="underline break-all">{v}</a> : <span className="whitespace-pre-wrap">{v}</span>}
    </div>) : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Partner Applications</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {["all", ...STATUSES].map((s) => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
              {s === "all" ? "All" : label(s)} ({s === "all" ? apps.length : apps.filter((a) => a.status === s).length})
            </Button>
          ))}
        </div>
        <Input placeholder="Search brand, owner, email, location" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-6 max-w-md" />

        {shown.length === 0 && <p className="text-muted-foreground">No applications found.</p>}
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a.id} className="border border-border rounded-lg bg-card">
              <button className="w-full text-left p-4 flex flex-wrap items-center justify-between gap-2" onClick={() => setOpen(open === a.id ? null : a.id)}>
                <div>
                  <p className="font-semibold">{a.brand_name}</p>
                  <p className="text-sm text-muted-foreground">{a.owner_name} · {a.email} · {a.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                  <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{label(a.status)}</Badge>
                </div>
              </button>
              {open === a.id && (
                <div className="border-t border-border p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-2">
                    {row("Phone", a.phone)}{row("Instagram", a.instagram)}{row("Website", a.website)}
                    {row("Category", a.business_category)}{row("Products sold", a.products_sold)}
                    {row("Expected products", a.expected_products)}{row("Catalogue", a.catalogue_url)}
                    {row("Logo", a.logo_url)}{row("GST", a.gst_info)}
                  </div>
                  <div className="flex gap-2">
                    {a.logo_path && <Button size="sm" variant="outline" onClick={() => openFile(a.logo_path!)}>View Logo</Button>}
                    {a.catalogue_path && <Button size="sm" variant="outline" onClick={() => openFile(a.catalogue_path!)}>View Catalogue</Button>}
                  </div>
                  {row("Description", a.business_description)}{row("Why partner", a.why_partner)}
                  {row("Shipping", a.shipping_info)}{row("Return policy", a.return_policy)}{row("Notes from applicant", a.additional_notes)}
                  {(() => {
                    const ps = sales.filter((x) => x.partner_id === a.id);
                    const gross = ps.reduce((t, x) => t + Number(x.customer_final_price) * x.quantity, 0);
                    const pe = ps.reduce((t, x) => t + Number(x.partner_earnings), 0);
                    const ve = ps.reduce((t, x) => t + Number(x.vastra_earnings), 0);
                    return (
                      <div className="border border-border rounded-md p-3 bg-muted/30">
                        <p className="text-sm font-medium mb-2">Commission & earnings</p>
                        <div className="flex flex-wrap items-end gap-2 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vastra commission %</p>
                            <Input type="number" min="0" max="100" step="0.5" className="w-28"
                              value={pctEdit[a.id] ?? String((a as any).commission_percentage ?? 10)}
                              onChange={(e) => setPctEdit({ ...pctEdit, [a.id]: e.target.value })} />
                          </div>
                          <Button size="sm" variant="outline" onClick={() => saveCommission(a.id)}>Save rate</Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div><p className="text-xs text-muted-foreground">Items sold</p><p className="font-semibold">{ps.reduce((t, x) => t + x.quantity, 0)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Customer sales</p><p className="font-semibold">{inr(gross)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Partner earnings</p><p className="font-semibold">{inr(pe)}</p></div>
                          <div><p className="text-xs text-muted-foreground">Vastra earnings</p><p className="font-semibold text-primary">{inr(ve)}</p></div>
                        </div>
                      </div>
                    );
                  })()}
                   <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={a.size_editing_allowed} onChange={e => update(a.id, { size_editing_allowed: e.target.checked })} />Allow partner size-chart edits</label>
                  <div>
                    <p className="text-sm font-medium mb-1">Internal notes (admin only)</p>
                    <Textarea rows={3} value={notes[a.id] ?? a.internal_notes ?? ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => update(a.id, { internal_notes: notes[a.id] ?? a.internal_notes })}>Save notes</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "under_review" })}>Mark Under Review</Button>
                    <Button size="sm" onClick={() => update(a.id, { status: "approved" })}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "on_hold" })}>Put On Hold</Button>
                    <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "info_requested" })}>Request More Info</Button>
                    <Button size="sm" variant="destructive" onClick={() => update(a.id, { status: "rejected" })}>Reject</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Delete</Button>
                    <a href={`mailto:${a.email}?subject=Your Vastra Luxe Partner Application`}><Button size="sm" variant="ghost">Email applicant</Button></a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PartnerApplications;
