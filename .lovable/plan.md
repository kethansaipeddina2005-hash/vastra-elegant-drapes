

## Plan: Add "Add to Cart" Button to ProductCard

Since `ProductCard` is the shared component used everywhere products are displayed (Collections, Featured, Recently Viewed, Wishlist), adding the cart button here will cover all locations.

### Changes

**`src/components/ProductCard.tsx`**
- Import `ShoppingCart` from lucide-react and `useCart` from CartContext
- Add a small cart icon button at the bottom-right of the image overlay (mirroring the wishlist heart at top-right)
- The button calls `addToCart(product)` with `e.preventDefault()` to avoid navigating to the product page
- Style: small circular button with `bg-primary text-primary-foreground`, appears on hover or always visible on mobile

