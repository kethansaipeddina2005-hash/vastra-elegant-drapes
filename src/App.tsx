import { useState, useEffect, lazy, Suspense } from "react";
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
import { PricingProvider } from "@/contexts/PricingContext";
import LoadingScreen from "@/components/LoadingScreen";

// Eagerly load the home page for fastest initial render
import Index from "./pages/Index";

// Lazy load all other pages
const Collections = lazy(() => import("./pages/Collections"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/account/Login"));
const Register = lazy(() => import("./pages/account/Register"));
const ForgotPassword = lazy(() => import("./pages/account/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/account/ResetPassword"));
const Dashboard = lazy(() => import("./pages/account/Dashboard"));
const Orders = lazy(() => import("./pages/account/Orders"));
const Wishlist = lazy(() => import("./pages/account/Wishlist"));
const Profile = lazy(() => import("./pages/account/Profile"));
const Addresses = lazy(() => import("./pages/account/Addresses"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Reels = lazy(() => import("./pages/Reels"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminSubscriptions = lazy(() => import("./pages/admin/Subscriptions"));
const AdminChat = lazy(() => import("./pages/admin/Chat"));
const AdminMessages = lazy(() => import("./pages/admin/Messages"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('app-loaded');
    
    if (!hasLoaded) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('app-loaded', 'true');
      }, 800);
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
            <PricingProvider>
            <CartProvider>
              <WishlistProvider>
                <RecentlyViewedProvider>
                  {isLoading && <LoadingScreen />}
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Suspense fallback={<PageFallback />}>
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
                        <Route path="/account/forgot-password" element={<ForgotPassword />} />
                        <Route path="/account/reset-password" element={<ResetPassword />} />
                        <Route path="/account/dashboard" element={<Dashboard />} />
                        <Route path="/account/orders" element={<Orders />} />
                        <Route path="/account/wishlist" element={<Wishlist />} />
                        <Route path="/account/profile" element={<Profile />} />
                        <Route path="/account/addresses" element={<Addresses />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="/reels" element={<Reels />} />
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
                        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                        <Route path="/admin/chat" element={<AdminChat />} />
                        <Route path="/admin/messages" element={<AdminMessages />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </RecentlyViewedProvider>
              </WishlistProvider>
            </CartProvider>
            </PricingProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
