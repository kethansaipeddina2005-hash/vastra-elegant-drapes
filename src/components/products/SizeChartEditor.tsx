import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SizeChart, parseSizeChart, validateSizeChart } from '@/lib/sizing';
import { toast } from 'sonner';
function MeasurementColumn({ name, index, disabled, onRename, onRemove }: { name: string; index: number; disabled?: boolean; onRename: (name: string) => boolean; onRemove: () => void }) {
  const [draft, setDraft] = useState(name);
  useEffect(() => setDraft(name), [name]);
  const commit = () => { if (!onRename(draft.trim())) setDraft(name); };
  return <div className="flex items-center gap-2">
    <Input aria-label={`Measurement column ${index + 1}`} disabled={disabled} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
    <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={disabled} aria-label={`Remove measurement ${name}`} title={`Remove ${name}`} onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
  </div>;
}
interface Props { enabled: boolean; chart: SizeChart; onChange: (enabled: boolean, chart: SizeChart) => void; disabled?: boolean; admin?: boolean; categoryId?: string; }
export default function SizeChartEditor({ enabled, chart, onChange, disabled, admin, categoryId }: Props) {
  const [templates, setTemplates] = useState<Array<{id: string; name: string; chart: unknown; category_id: string | null}>>([]);
  const [templateName, setTemplateName] = useState('');
  const load = async () => { const { data } = await supabase.from('size_chart_templates').select('*').order('name'); setTemplates(data || []); };
  useEffect(() => { load(); }, []);
  const change = (next: SizeChart) => onChange(enabled, next);
  const renameColumn = (index: number, name: string) => {
    const previous = chart.columns[index];
    if (name === previous) return true;
    if (!name || chart.columns.some((column, i) => i !== index && column.toLowerCase() === name.toLowerCase())) {
      toast.error('Each measurement needs a unique, non-empty name');
      return false;
    }
    change({ ...chart, columns: chart.columns.map((column, i) => i === index ? name : column), rows: chart.rows.map(row => {
      const measurements = { ...row.measurements };
      const value = measurements[previous];
      delete measurements[previous];
      if (value !== undefined) measurements[name] = value;
      return { ...row, measurements };
    }) });
    return true;
  };
  const addColumn = () => {
    let number = 1;
    while (chart.columns.some(column => column.toLowerCase() === `measurement ${number}`)) number++;
    change({ ...chart, columns: [...chart.columns, `Measurement ${number}`] });
  };
  const removeColumn = (index: number) => change({ ...chart, columns: chart.columns.filter((_, i) => i !== index), rows: chart.rows.map(row => {
    const measurements = { ...row.measurements };
    delete measurements[chart.columns[index]];
    return { ...row, measurements };
  }) });
  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    const issue = validateSizeChart(chart);
    if (issue) return toast.error(issue);
    const { error } = await supabase.from('size_chart_templates').insert({ name: templateName.trim(), category_id: categoryId || null, chart: JSON.parse(JSON.stringify(chart)) });
    if (error) return toast.error(error.message);
    setTemplateName(''); await load(); toast.success('Template saved');
  };
  return <section className="space-y-4 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-3"><Label>Size selection & chart</Label><Switch aria-label="Enable size selection" checked={enabled} disabled={disabled} onCheckedChange={value => onChange(value, chart)} /></div>
    {disabled && <p className="text-sm text-muted-foreground">Size editing is restricted by Vastra.</p>}
    {enabled && <>
      <div className="flex flex-wrap gap-3">
        <Select disabled={disabled} onValueChange={id => { const template = templates.find(t => t.id === id); if (template) change(parseSizeChart(template.chart)); }}><SelectTrigger className="w-52"><SelectValue placeholder="Apply chart template" /></SelectTrigger><SelectContent>{templates.filter(t => !t.category_id || t.category_id === categoryId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
        <Select disabled={disabled} value={chart.unit} onValueChange={unit => change({ ...chart, unit: unit === 'in' ? 'in' : 'cm' })}><SelectTrigger className="w-28" aria-label="Measurement unit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="in">inches</SelectItem></SelectContent></Select>
      </div>
      <div className="space-y-2"><Label>Measurement columns</Label><div className="grid gap-2 sm:grid-cols-2">{chart.columns.map((column, index) => <MeasurementColumn key={index} name={column} index={index} disabled={disabled} onRename={name => renameColumn(index, name)} onRemove={() => removeColumn(index)} />)}</div><Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addColumn}><Plus className="h-4 w-4 mr-2" />Add measurement</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="p-2 text-left">Size</th><th className="p-2 text-left">Stock</th>{chart.columns.map(c => <th key={c} className="p-2 text-left whitespace-nowrap">{c} ({chart.unit})</th>)}<th /></tr></thead><tbody>
        {chart.rows.map((row, index) => <tr key={index}><td className="p-1"><Input aria-label={`Size ${index + 1}`} className="min-w-20" disabled={disabled} value={row.size} onChange={e => change({ ...chart, rows: chart.rows.map((r, i) => i === index ? { ...r, size: e.target.value } : r) })} /></td><td className="p-1"><Input aria-label={`Stock ${index + 1}`} className="min-w-20" type="number" min="0" step="1" disabled={disabled} value={row.stock} onChange={e => change({ ...chart, rows: chart.rows.map((r, i) => i === index ? { ...r, stock: Number(e.target.value) } : r) })} /></td>{chart.columns.map(c => <td key={c} className="p-1"><Input aria-label={`${c} ${index + 1}`} className="min-w-20" type="number" min="0.01" step="0.01" disabled={disabled} value={row.measurements[c] || ''} onChange={e => change({ ...chart, rows: chart.rows.map((r, i) => i === index ? { ...r, measurements: { ...r.measurements, [c]: e.target.value } } : r) })} /></td>)}<td><Button type="button" variant="ghost" size="icon" aria-label={`Remove size ${index + 1}`} disabled={disabled} onClick={() => change({ ...chart, rows: chart.rows.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button></td></tr>)}
      </tbody></table></div>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => change({ ...chart, rows: [...chart.rows, { size: '', stock: 0, measurements: {} }] })}><Plus className="h-4 w-4 mr-2" />Add size</Button>
      <p className="text-sm text-muted-foreground">Total stock: {chart.rows.reduce((n, row) => n + row.stock, 0)}</p>
      {admin && <div className="flex flex-wrap gap-2"><Input className="max-w-xs" placeholder="Template name" value={templateName} onChange={e => setTemplateName(e.target.value)} /><Button type="button" variant="outline" onClick={saveTemplate}><Save className="h-4 w-4 mr-2" />Save template</Button>{templates.map(t => <Button key={t.id} type="button" size="sm" variant="ghost" onClick={async () => { if (!confirm(`Delete template ${t.name}?`)) return; const { error } = await supabase.from('size_chart_templates').delete().eq('id',t.id); if (error) toast.error(error.message); else load(); }}><Trash2 className="h-3 w-3 mr-1" />{t.name}</Button>)}</div>}
    </>}
  </section>;
}
