import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { RecentlyViewedProvider } from "@/contexts/RecentlyViewedContext";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import Collections from "./pages/Collections";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/account/Login";
import Register from "./pages/account/Register";
import Dashboard from "./pages/account/Dashboard";
import Orders from "./pages/account/Orders";
import Wishlist from "./pages/account/Wishlist";
import Profile from "./pages/account/Profile";
import Addresses from "./pages/account/Addresses";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminCustomers from "./pages/admin/Customers";
import AdminBanners from "./pages/admin/Banners";
import AdminCoupons from "./pages/admin/Coupons";
import AdminUsers from "./pages/admin/Users";
import AdminPayments from "./pages/admin/Payments";
import AdminCategories from "./pages/admin/Categories";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading only on first mount
    const hasLoaded = sessionStorage.getItem('app-loaded');
    
    if (!hasLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('app-loaded', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  {isLoading && <LoadingScreen />}
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/account/login" element={<Login />} />
          <Route path="/account/register" element={<Register />} />
          <Route path="/account/dashboard" element={<Dashboard />} />
          <Route path="/account/orders" element={<Orders />} />
          <Route path="/account/wishlist" element={<Wishlist />} />
          <Route path="/account/profile" element={<Profile />} />
          <Route path="/account/addresses" element={<Addresses />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="*" element={<NotFound />} />
                  </Routes>
                  </BrowserRouter>
                </RecentlyViewedProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
