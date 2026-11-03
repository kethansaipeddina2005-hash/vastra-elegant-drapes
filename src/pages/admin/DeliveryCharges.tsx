import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/hooks/useAdmin';
import { useDeliveryRates } from '@/hooks/useDeliveryRates';
import { countryName, defaultDeliveryRates, deliveryCountries, type DeliveryRate } from '@/lib/delivery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function RateRow({ rate, onSave, onDelete }: { rate: DeliveryRate; onSave: (rate: DeliveryRate) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [amount, setAmount] = useState(String(rate.amount));
  const [threshold, setThreshold] = useState(rate.free_above === null ? '' : String(rate.free_above));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!amount.trim() || !Number.isFinite(Number(amount)) || Number(amount) < 0 || (threshold !== '' && (!Number.isFinite(Number(threshold)) || Number(threshold) < 0))) {
      toast.error('Enter a valid amount of ₹0 or more'); return;
    }
    setBusy(true);
    try { await onSave({ ...rate, amount: Number(amount), free_above: threshold === '' ? null : Number(threshold) }); }
    finally { setBusy(false); }
  };
  return <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_160px_auto] gap-3 py-4 border-b items-end">
    <div className="font-medium self-center">{rate.country_name}</div>
    <div><Label htmlFor={`amount-${rate.country_code}`}>Delivery charge (₹)</Label><Input id={`amount-${rate.country_code}`} type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></div>
    <div><Label htmlFor={`threshold-${rate.country_code}`}>Free above (₹)</Label><Input id={`threshold-${rate.country_code}`} type="number" min="0" step="0.01" placeholder="No threshold" value={threshold} onChange={e => setThreshold(e.target.value)} /></div>
    <div className="flex gap-2"><Button size="icon" title={`Save ${rate.country_name} rate`} aria-label={`Save ${rate.country_name} rate`} disabled={busy} onClick={save}><Save className="h-4 w-4" /></Button>{onDelete && <Button variant="outline" size="icon" title={`Remove ${rate.country_name} override`} aria-label={`Remove ${rate.country_name} override`} disabled={busy} onClick={async () => { setBusy(true); try { await onDelete(); } finally { setBusy(false); } }}><Trash2 className="h-4 w-4" /></Button>}</div>
  </div>;
}

export default function DeliveryCharges() {
  const { isAdmin, loading } = useAdmin();
  const ratesQuery = useDeliveryRates();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState('');
  const [adding, setAdding] = useState(false);
  const rates = ratesQuery.data || [];
  const save = async (rate: DeliveryRate) => {
    const { error } = await supabase.from('delivery_rates').upsert({ ...rate, updated_at: new Date().toISOString() });
    if (error) { toast.error('Could not save delivery charge'); return; }
    await queryClient.invalidateQueries({ queryKey: ['delivery-rates'] });
    toast.success('Delivery charge saved');
  };
  return <Layout><div className="container mx-auto px-4 py-8">
    <Button variant="ghost" asChild><Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" />Admin Dashboard</Link></Button>
    <h1 className="text-3xl font-playfair font-bold mt-4 mb-6">Delivery Charges</h1>
    {loading ? <div className="h-40 bg-muted animate-pulse rounded-md" /> : !isAdmin ? <p className="text-destructive">Admin access required.</p> : ratesQuery.isPending ? <div className="h-40 bg-muted animate-pulse rounded-md" /> : ratesQuery.isError ? <div><p className="text-destructive">Delivery charges could not be loaded.</p><Button variant="outline" onClick={() => ratesQuery.refetch()}>Retry</Button></div> : <div className="max-w-4xl">
      <h2 className="text-lg font-semibold">Default charges</h2>
      {defaultDeliveryRates.map(fallback => <RateRow key={fallback.country_code} rate={rates.find(r => r.country_code === fallback.country_code) || fallback} onSave={save} />)}
      <h2 className="text-lg font-semibold mt-8 mb-4">Country charges</h2>
      <div className="flex flex-wrap gap-3"><Select value={country} onValueChange={setCountry}><SelectTrigger className="w-full sm:w-72" aria-label="Country to add"><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{deliveryCountries.filter(c => c.code !== 'IN' && !rates.some(r => r.country_code === c.code)).map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent></Select><Button disabled={!country || adding} onClick={async () => { setAdding(true); try { await save({ country_code: country, country_name: countryName(country), amount: rates.find(r => r.country_code === '*')?.amount ?? 4000, free_above: null }); setCountry(''); } finally { setAdding(false); } }}><Plus className="mr-2 h-4 w-4" />Add country</Button></div>
      {rates.filter(r => !['IN', '*'].includes(r.country_code)).map(rate => <RateRow key={rate.country_code} rate={rate} onSave={save} onDelete={async () => { if (!window.confirm(`Remove ${rate.country_name} rate and use the other-countries charge?`)) return; const { error } = await supabase.from('delivery_rates').delete().eq('country_code', rate.country_code); if (error) toast.error('Could not remove delivery charge'); else { await queryClient.invalidateQueries({ queryKey: ['delivery-rates'] }); toast.success('Country override removed'); } }} />)}
    </div>}
  </div></Layout>;
}