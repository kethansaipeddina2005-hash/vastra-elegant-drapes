export interface SizeRow { size: string; stock: number; measurements: Record<string, string>; }
export interface SizeChart { unit: 'cm' | 'in'; columns: string[]; rows: SizeRow[]; }
export const emptySizeChart = (): SizeChart => ({ unit: 'cm', columns: ['Bust', 'Waist', 'Hip', 'Shoulder', 'Length'], rows: [] });
export function parseSizeChart(value: unknown): SizeChart {
  if (!value || typeof value !== 'object') return emptySizeChart();
  const chart = value as Partial<SizeChart>;
  return { unit: chart.unit === 'in' ? 'in' : 'cm', columns: Array.isArray(chart.columns) ? chart.columns : [], rows: Array.isArray(chart.rows) ? chart.rows : [] };
}
export const sizeStock = (chart: SizeChart, size?: string | null) => chart.rows.find(row => row.size === size)?.stock ?? 0;
export function validateSizeChart(chart: SizeChart): string | null {
  if (!chart.rows.length) return 'Add at least one size';
  const labels = chart.rows.map(row => row.size.trim().toLowerCase());
  if (labels.some(label => !label) || new Set(labels).size !== labels.length) return 'Each size needs a unique name';
  if (chart.rows.some(row => !Number.isInteger(row.stock) || row.stock < 0)) return 'Stock must be a non-negative whole number';
  if (chart.rows.some(row => Object.values(row.measurements).some(value => value !== '' && (!Number.isFinite(Number(value)) || Number(value) <= 0)))) return 'Measurements must be positive numbers';
  return null;
}
