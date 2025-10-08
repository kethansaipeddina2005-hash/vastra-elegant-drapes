import { Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contact" className="bg-secondary border-t border-border py-12 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-playfair font-semibold text-foreground mb-2">
              Vastra
            </h3>
            <p className="text-muted-foreground">
              Grace in Every Drape
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-foreground font-medium mb-2">Contact Us</p>
            <a 
              href="tel:+917997909061" 
              className="text-primary hover:text-primary/80 transition-colors text-lg"
            >
              +91 79979 09061
            </a>
          </div>
          
          <div className="flex gap-4">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card p-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-card p-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border text-center text-muted-foreground">
          <p>Copyright © 2025 Vastra — All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
