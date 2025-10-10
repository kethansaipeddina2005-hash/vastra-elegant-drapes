import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Heart, User, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/account/login");
    }
  }, [user, loading, navigate]);

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
            <h2 className="text-2xl font-playfair font-bold mb-6">Recent Orders</h2>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
              <Link to="/collections">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
