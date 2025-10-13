import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

const Addresses = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/account/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("addresses").insert({
        ...newAddress,
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address added successfully",
      });

      setShowForm(false);
      setNewAddress({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        is_default: false,
      });
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      fetchAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-playfair font-bold text-foreground">
              Saved Addresses
            </h1>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>

          {showForm && (
            <Card className="p-6 mb-6">
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newAddress.full_name}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, full_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={newAddress.address_line1}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, address_line1: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address_line2"
                    value={newAddress.address_line2}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, address_line2: e.target.value })
                    }
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={newAddress.postal_code}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, postal_code: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit">Save Address</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No saved addresses</p>
              </Card>
            ) : (
              addresses.map((address) => (
                <Card key={address.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{address.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{address.phone}</p>
                      <p className="mt-2">{address.address_line1}</p>
                      {address.address_line2 && <p>{address.address_line2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postal_code}
                      </p>
                      {address.is_default && (
                        <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Addresses;
