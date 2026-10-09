import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';
import { trackAddToCart } from '@/lib/analytics';
import { parseSizeChart, sizeStock } from '@/lib/sizing';
import { syncCartToServer } from '@/lib/cartTracking';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string | null) => void;
  removeFromCart: (productId: number, selectedSize?: string | null) => void;
  updateQuantity: (productId: number, quantity: number, selectedSize?: string | null) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  promoCode: string;
  discountPercent: number;
  setPromoCode: (code: string) => void;
  setDiscountPercent: (percent: number) => void;
  clearPromo: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vastra-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [promoCode, setPromoCode] = useState(() => {
    const saved = localStorage.getItem('vastra-promo-code');
    return saved || '';
  });

  const [discountPercent, setDiscountPercent] = useState(() => {
    const saved = localStorage.getItem('vastra-discount-percent');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('vastra-cart', JSON.stringify(cart));
  }, [cart]);

  // Anonymous cart tracking (no personal details collected here)
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current && cart.length === 0) {
      firstSync.current = false;
      return;
    }
    firstSync.current = false;
    const timer = setTimeout(() => {
      syncCartToServer(
        cart.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image ?? null,
          selected_size: item.selectedSize ?? null,
        }))
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vastra-promo-code', promoCode);
    localStorage.setItem('vastra-discount-percent', discountPercent.toString());
  }, [promoCode, discountPercent]);

  const addToCart = (product: Product, quantity = 1, selectedSize: string | null = null) => {
    quantity = Math.max(1, quantity);
    if (product.sizingEnabled && !selectedSize) {
      toast({ title: 'Select a size', description: 'Choose an available size on the product page.', variant: 'destructive' });
      window.location.assign(`/product/${product.id}`);
      return;
    }
    trackAddToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        categoryNames: product.categoryNames,
      },
      quantity,
    );
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && (item.selectedSize ?? null) === selectedSize);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const maxQty = product.sizingEnabled ? sizeStock(parseSizeChart(product.sizeChart), selectedSize) : product.stockQuantity || 0;

      if (maxQty <= 0) {
        toast({ title: 'Out of stock', description: `${product.name} is currently out of stock`, variant: 'destructive' });
        return prevCart;
      }

      if (currentQty + quantity > maxQty) {
        toast({ title: 'Stock limit reached', description: `Only ${maxQty} available for ${product.name}`, variant: 'destructive' });
        if (currentQty >= maxQty) return prevCart;
        const addableQty = maxQty - currentQty;
        if (existingItem) {
          return prevCart.map(item =>
            item.id === product.id && (item.selectedSize ?? null) === selectedSize ? { ...item, quantity: maxQty } : item
          );
        }
        return [...prevCart, { ...product, selectedSize, quantity: addableQty }];
      }

      if (existingItem) {
        toast({ title: 'Updated cart', description: `${product.name} quantity updated` });
        return prevCart.map(item =>
          item.id === product.id && (item.selectedSize ?? null) === selectedSize ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      toast({ title: 'Added to cart', description: `${product.name} added to cart` });
      return [...prevCart, { ...product, selectedSize, quantity }];
    });
  };

  const removeFromCart = (productId: number, selectedSize: string | null = null) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId || (item.selectedSize ?? null) !== selectedSize));
    toast({ title: 'Removed from cart', description: 'Item removed successfully' });
  };

  const updateQuantity = (productId: number, quantity: number, selectedSize: string | null = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId && (item.selectedSize ?? null) === selectedSize) {
          const maxQty = item.sizingEnabled ? sizeStock(parseSizeChart(item.sizeChart), selectedSize) : item.stockQuantity || 0;
          const clampedQty = maxQty > 0 ? Math.min(quantity, maxQty) : quantity;
          if (quantity > maxQty && maxQty > 0) {
            toast({ title: 'Stock limit', description: `Only ${maxQty} available`, variant: 'destructive' });
          }
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('vastra-cart');
  };

  const clearPromo = () => {
    setPromoCode('');
    setDiscountPercent(0);
    localStorage.removeItem('vastra-promo-code');
    localStorage.removeItem('vastra-discount-percent');
  };

  const cartTotal = cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const cartTotalForeign = cart.reduce((total, item) => {
    const fp = item.foreignPrice;
    return total + (fp != null && fp > 0 ? fp : item.price) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartTotal, 
      cartCount,
      promoCode,
      discountPercent,
      setPromoCode,
      setDiscountPercent,
      clearPromo
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
