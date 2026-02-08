import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search, ShoppingCart, User, Menu, X, Heart, LogOut, Shield, Play } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <img src={logo} alt="Vastra Logo" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            <h1 className="text-xl md:text-3xl font-playfair font-semibold text-foreground">
              Vastra
            </h1>
          </Link>
          
          <form
            className="hidden md:flex flex-1 max-w-md mx-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchValue.trim()) {
                navigate(`/collections?search=${encodeURIComponent(searchValue.trim())}`);
                setSearchValue('');
              }
            }}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for sarees..."
                className="w-full pl-9 pr-4 rounded-full border-border bg-muted/50"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </form>

          <nav className="hidden lg:flex gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">Home</Link>
            <Link to="/collections" className="text-foreground hover:text-primary transition-colors font-medium">Collections</Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">About</Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">Contact</Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors font-medium">Blog</Link>
          </nav>
          
          <div className="flex items-center gap-1 md:gap-3">
            <Link to="/reels" className="flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:h-10 lg:w-10">
                <Play className="h-5 w-5" />
              </Button>
            </Link>

            <Link to="/account/wishlist" className="hidden lg:block flex-shrink-0">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden lg:flex h-10 w-10 flex-shrink-0">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin/dashboard" className="w-full cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/account/dashboard" className="w-full cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="w-full cursor-pointer">
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/account/login" className="hidden lg:block flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            

            <Link to="/cart" className="hidden lg:block flex-shrink-0">
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile search bar */}
        <form
          className="md:hidden mt-3 animate-fade-in"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchValue.trim()) {
              navigate(`/collections?search=${encodeURIComponent(searchValue.trim())}`);
              setSearchValue('');
            }
          }}
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for sarees..."
              className="w-full pl-9 pr-4 rounded-full border-border bg-muted/50"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </form>
        
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 flex flex-col gap-4 animate-fade-in">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/collections" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Collections</Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors font-medium" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
