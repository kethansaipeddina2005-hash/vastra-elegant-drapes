import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Payment {
  id: string;
  transaction_id: string;
  order_number: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const statusConfig = {
      success: { icon: CheckCircle, color: 'bg-green-500', text: 'SUCCESS' },
      pending: { icon: Clock, color: 'bg-yellow-500', text: 'PENDING' },
      failed: { icon: XCircle, color: 'bg-red-500', text: 'FAILED' }
    };
    return statusConfig[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No payment transactions found yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const statusConfig = getStatusBadge(payment.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">Transaction #{payment.transaction_id}</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={`flex items-center gap-2 ${statusConfig.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusConfig.text}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Customer</p>
                          <p className="font-semibold">{payment.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Order Number</p>
                          <p className="font-semibold">{payment.order_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Payment Method</p>
                          <p className="font-semibold capitalize">{payment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-semibold text-green-600 text-lg">${payment.amount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Payments;
