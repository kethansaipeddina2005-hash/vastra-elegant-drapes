-- Fix order_items INSERT policy to allow users to create items for their orders
CREATE POLICY "Users can create order items for their orders"
  ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );