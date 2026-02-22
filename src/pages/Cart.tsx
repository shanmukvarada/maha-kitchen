import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Loader2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export const Cart = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't added any delicious food yet.</p>
        <Link to="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-orange-500 hover:bg-orange-600 transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 sm:gap-4">
                <img src={item.imageUrl} alt={item.name} className="w-10 h-10 sm:w-20 sm:h-20 object-cover rounded-lg" />
                <div>
                  <h3 className="font-semibold text-xs sm:text-base text-gray-900">{item.name}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">₹{(item.price || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-6">
                <div className="flex items-center gap-1 sm:gap-3 bg-gray-50 rounded-full px-2 py-0.5 sm:px-3 sm:py-1">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-0.5 sm:p-1 rounded-full hover:bg-white shadow-sm transition-colors text-gray-600"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <span className="font-medium text-xs sm:text-sm w-3 sm:w-4 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-0.5 sm:p-1 rounded-full hover:bg-white shadow-sm transition-colors text-orange-500"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-3 sm:p-6">
          <div className="flex justify-between items-center mb-2 sm:mb-6">
            <span className="text-sm sm:text-lg font-medium text-gray-900">Total</span>
            <span className="text-lg sm:text-2xl font-bold text-gray-900">₹{(total || 0).toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 sm:py-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : (
              <>
                Checkout <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
