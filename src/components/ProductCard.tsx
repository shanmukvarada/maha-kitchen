import React from 'react';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, items, removeFromCart, updateQuantity } = useCart();
  const cartItem = items.find(item => item.id === product.id);

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col h-full"
    >
      <div className="relative aspect-video sm:h-48">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-gray-900">
          ₹{(product.price || 0).toFixed(2)}
        </div>
      </div>
      <div className="p-2 sm:p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <div>
            <h3 className="text-xs sm:text-lg font-bold text-gray-900 line-clamp-1 sm:line-clamp-2">{product.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 hidden sm:block">{product.description}</p>
          </div>
        </div>
        
        <div className="mt-auto pt-1 sm:pt-4 flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 rounded-full text-gray-600 uppercase tracking-wide truncate max-w-[50px] sm:max-w-none">
            {product.category}
          </span>
          
          {cartItem ? (
            <div className="flex items-center gap-1 sm:gap-3 bg-gray-50 rounded-full px-1.5 py-0.5 sm:px-2 sm:py-1">
              <button 
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="p-0.5 sm:p-1 rounded-full hover:bg-white shadow-sm transition-colors text-gray-600"
              >
                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <span className="font-medium text-xs sm:text-sm w-3 sm:w-4 text-center">{cartItem.quantity}</span>
              <button 
                onClick={() => addToCart(product)}
                className="p-0.5 sm:p-1 rounded-full hover:bg-white shadow-sm transition-colors text-orange-500"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              className="flex items-center gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium transition-colors"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
