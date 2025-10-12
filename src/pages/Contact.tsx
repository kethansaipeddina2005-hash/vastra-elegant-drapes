import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { error } = await supabase.functions.invoke('send-contact-notification', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-playfair font-bold text-foreground mb-4 text-center">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">support@vastra.com</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-muted-foreground">+91 79979 09061</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Address</h3>
                    <p className="text-muted-foreground">
                      Kotthuru, Srikakulam<br />
                      Andhra Pradesh 532455<br />
                      India
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Saturday: 10:00 AM - 7:00 PM IST<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-playfair font-bold text-foreground mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">What is your return policy?</h3>
                <p className="text-muted-foreground">
                  We offer a 7-day return policy for all products. Items must be unused and in original packaging.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How long does shipping take?</h3>
                <p className="text-muted-foreground">
                  Delivery typically takes 5-7 business days within India. International shipping is available and takes 10-15 business days.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do you offer international shipping?</h3>
                <p className="text-muted-foreground">
                  Yes, we ship worldwide. Shipping costs and delivery times vary by location.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How can I track my order?</h3>
                <p className="text-muted-foreground">
                  Once your order ships, you'll receive a tracking number via email. You can also view order status in your account dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
