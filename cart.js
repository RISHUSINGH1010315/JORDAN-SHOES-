// Jordan Shopping Cart Engine
import JordanAuth from './auth.js';

const CART_KEY = 'jordan_cart';

const JordanCart = {
  getCart() {
    const cartJson = localStorage.getItem(CART_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
  },
  
  saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    this.updateNavBadge();
  },
  
  addToCart(product, size = null) {
    const cart = this.getCart();
    
    // Set default size if none provided
    if (!size) {
      const user = JordanAuth.getCurrentUser();
      size = user?.profile?.size || '10.5';
    }
    
    // Create unique product ID inside cart by product name and size
    const cartItemId = `${product.name}-${size}`.replace(/\s+/g, '-').toLowerCase();
    
    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        cartItemId,
        name: product.name,
        colorway: product.colorway || 'Original',
        price: parseFloat(product.price),
        imgUrl: product.imgUrl,
        size: size,
        quantity: 1
      });
    }
    
    this.saveCart(cart);
  },
  
  updateQuantity(cartItemId, newQty) {
    let cart = this.getCart();
    const index = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (index !== -1) {
      if (newQty <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].quantity = parseInt(newQty);
      }
      this.saveCart(cart);
    }
  },
  
  updateSize(cartItemId, newSize) {
    let cart = this.getCart();
    const index = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (index !== -1) {
      cart[index].size = newSize;
      
      // Merge items if the size change results in a duplicate
      const newCartItemId = `${cart[index].name}-${newSize}`.replace(/\s+/g, '-').toLowerCase();
      const duplicateIndex = cart.findIndex((item, idx) => item.cartItemId === newCartItemId && idx !== index);
      
      if (duplicateIndex !== -1) {
        cart[duplicateIndex].quantity += cart[index].quantity;
        cart.splice(index, 1);
      } else {
        cart[index].cartItemId = newCartItemId;
      }
      
      this.saveCart(cart);
    }
  },
  
  removeFromCart(cartItemId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    this.saveCart(cart);
  },
  
  clearCart() {
    localStorage.removeItem(CART_KEY);
    this.updateNavBadge();
  },
  
  getCartCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
  
  getCartTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 0.00; // Free ground shipping
    const tax = subtotal * 0.08; // 8% sales tax
    const total = subtotal + tax;
    
    return {
      subtotal,
      shipping,
      tax,
      total
    };
  },
  
  updateNavBadge() {
    // Find all shopping bag badge elements on the page and update count
    const count = this.getCartCount();
    
    // Standard bag buttons with badges (like in Collection.html)
    const badges = document.querySelectorAll('#cart-badge, .cart-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('scale-0', 'hidden');
        badge.classList.add('scale-100');
      } else {
        badge.classList.remove('scale-100');
        badge.classList.add('scale-0', 'hidden');
      }
    });
  }
};

// Auto update badges on DOM load
document.addEventListener('DOMContentLoaded', () => {
  JordanCart.updateNavBadge();
});

window.JordanCart = JordanCart;
export default JordanCart;
