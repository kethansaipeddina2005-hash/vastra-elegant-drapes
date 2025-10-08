import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Register = () => {
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-playfair font-bold text-foreground mb-2 text-center">
            Create Account
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Join Vastra today
          </p>
          
          <form className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Your name" />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Create Account
            </Button>
          </form>
          
          <p className="mt-6 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/account/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
