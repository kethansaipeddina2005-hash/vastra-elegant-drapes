import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Heart, User, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/account/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchRecentOrders();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
                My Account
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Manage your account and orders here.
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Link to="/account/orders">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <Package className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Orders</h3>
                <p className="text-sm text-muted-foreground">View order history</p>
              </Card>
            </Link>

            <Link to="/account/wishlist">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <Heart className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Wishlist</h3>
                <p className="text-sm text-muted-foreground">Saved items</p>
              </Card>
            </Link>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <User className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">Edit your details</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <MapPin className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Addresses</h3>
              <p className="text-sm text-muted-foreground">Manage shipping</p>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-playfair font-bold">Recent Orders</h2>
              {recentOrders.length > 0 && (
                <Link to="/account/orders">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              )}
            </div>
            
            {loadingOrders ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
                <Link to="/collections">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.total_amount.toLocaleString()}</p>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'processing' ? 'secondary' :
                          order.status === 'shipped' ? 'secondary' :
                          'outline'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Payment: {order.payment_status}
                      </span>
                      <Link to="/account/orders">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
