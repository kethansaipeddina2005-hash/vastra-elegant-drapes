import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/collections", icon: Search, label: "Shop" },
  { path: "/account/wishlist", icon: Heart, label: "Wishlist" },
  { path: "/cart", icon: ShoppingCart, label: "Cart" },
  { path: "/account/dashboard", icon: User, label: "Account" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getBadge = (path: string) => {
    if (path === "/cart" && cartCount > 0) return cartCount;
    if (path === "/account/wishlist" && wishlistCount > 0) return wishlistCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          const badge = getBadge(path);

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
