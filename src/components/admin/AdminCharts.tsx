import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#6b7280',
  unknown: '#9ca3af',
};

const AdminCharts = () => {
  const { revenue, ordersByStatus, topProducts, lowStock, loading } = useAdminAnalytics();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading ? (
            <div className="h-full bg-muted/40 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders by status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading ? (
            <div className="h-full bg-muted/40 rounded animate-pulse" />
          ) : ordersByStatus.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No orders in the last 30 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {ordersByStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top products by units sold</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {loading ? (
            <div className="h-full bg-muted/40 rounded animate-pulse" />
          ) : topProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No sales yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="units" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Low stock
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 overflow-auto">
          {loading ? (
            <div className="h-full bg-muted/40 rounded animate-pulse" />
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products well stocked 🎉</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/admin/products"
                    className="flex items-center justify-between text-sm hover:bg-muted/40 rounded p-1.5 -mx-1.5 transition-colors"
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      p.stock_quantity === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.stock_quantity === 0 ? 'Out' : `${p.stock_quantity} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCharts;