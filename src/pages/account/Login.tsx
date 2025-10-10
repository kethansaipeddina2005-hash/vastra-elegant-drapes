import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate("/");
    }
    
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-playfair font-bold text-foreground mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to your account
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <p className="mt-6 text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/account/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
