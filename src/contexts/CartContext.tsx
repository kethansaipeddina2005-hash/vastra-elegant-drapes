import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types/product';
import { toast } from '@/hooks/use-toast';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
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

  useEffect(() => {
    localStorage.setItem('vastra-promo-code', promoCode);
    localStorage.setItem('vastra-discount-percent', discountPercent.toString());
  }, [promoCode, discountPercent]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        toast({ title: 'Updated cart', description: `${product.name} quantity updated` });
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      toast({ title: 'Added to cart', description: `${product.name} added to cart` });
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    toast({ title: 'Removed from cart', description: 'Item removed successfully' });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => (item.id === productId ? { ...item, quantity } : item))
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
