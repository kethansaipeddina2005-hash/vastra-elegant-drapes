import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // Insert subscription into database
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({ email: email.toLowerCase().trim() });

      if (insertError) {
        // Check for duplicate email
        if (insertError.code === '23505') {
          toast({
            title: "Already Subscribed",
            description: "This email is already on our mailing list.",
          });
          setEmail('');
          return;
        }
        throw insertError;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-subscription-email', {
          body: { email: email.toLowerCase().trim() },
        });
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
        // Don't fail the subscription if email fails
      }

      toast({
        title: "Welcome to Vastra! 🪷",
        description: "You've successfully subscribed to our newsletter.",
      });
      setEmail('');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground mb-4">
          Stay Connected
        </h2>
        <p className="text-muted-foreground mb-8">
          Subscribe to receive updates about new collections, exclusive offers, and style inspiration.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Subscribing...' : 'Subscribe'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
