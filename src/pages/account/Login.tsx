import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
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
          
          <form className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Sign In
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
