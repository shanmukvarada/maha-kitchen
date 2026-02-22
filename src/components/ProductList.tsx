import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic tomato and mozzarella with fresh basil.',
    price: 299,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Double Cheeseburger',
    description: 'Two beef patties, cheddar cheese, lettuce, tomato, and special sauce.',
    price: 349,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Pepperoni Feast',
    description: 'Loaded with pepperoni and extra cheese.',
    price: 399,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date()
  },
  {
    id: '4',
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings tossed in our signature hot sauce.',
    price: 249,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    createdAt: new Date()
  }
];

export const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if Firebase config is present
        if (!import.meta.env.VITE_FIREBASE_API_KEY || !db) {
          console.warn("Firebase config missing or db not initialized, using mock data");
          setProducts(MOCK_PRODUCTS);
          setCategories(['All', 'Pizza', 'Burgers', 'Sushi', 'Drinks', 'Desserts', 'Sides']);
          setLoading(false);
          return;
        }

        // Fetch Products
        const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const productSnapshot = await getDocs(qProducts);
        const productsData = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        
        if (productsData.length === 0) {
           setProducts(MOCK_PRODUCTS); // Fallback if DB is empty
        } else {
           setProducts(productsData);
        }

        // Fetch Categories
        const qCategories = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const categorySnapshot = await getDocs(qCategories);
        const categoriesData = categorySnapshot.docs.map(doc => doc.data().name);
        
        if (categoriesData.length > 0) {
          setCategories(['All', ...categoriesData]);
        } else {
          setCategories(['All', 'Pizza', 'Burgers', 'Sushi', 'Drinks', 'Desserts', 'Sides']);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products. Using mock data.");
        setProducts(MOCK_PRODUCTS);
        setCategories(['All', 'Pizza', 'Burgers', 'Sushi', 'Drinks', 'Desserts', 'Sides']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div id="menu" className="py-4 sm:py-12">
      <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Our Menu</h2>
      
      {/* Category Navigation Bar */}
      <div className="mb-4 sm:mb-8 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide">
        <div className="flex gap-2 sm:gap-3 min-w-max">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-3 py-1 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-200 hover:text-orange-500'}
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error} (This is expected in the preview environment if Firebase is not configured)
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No items found in this category.</p>
        </div>
      )}
    </div>
  );
};
