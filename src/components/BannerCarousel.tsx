import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface Banner {
  id: string;
  imageUrl: string;
}

export const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];
      setBanners(bannersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="h-40 sm:h-64 lg:h-96 bg-gray-100 rounded-3xl animate-pulse flex items-center justify-center mb-4 sm:mb-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Fallback if no banners
  if (banners.length === 0) {
    return (
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden mb-4 sm:mb-12 h-40 sm:h-64 lg:h-96">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-40"
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
            alt="Food background"
          />
        </div>
        <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center sm:text-left"
          >
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Delicious Food Delivered
            </h1>
            <p className="mt-2 sm:mt-4 text-sm sm:text-xl text-gray-300 max-w-3xl hidden sm:block">
              Order your favorite meals from the best restaurants in town. Fresh, hot, and delivered to your doorstep in minutes.
            </p>
            <div className="mt-3 sm:mt-8">
              <Link
                to="/#menu"
                className="inline-flex items-center px-3 py-1.5 sm:px-8 sm:py-3 border border-transparent text-xs sm:text-base font-medium rounded-full text-gray-900 bg-orange-500 hover:bg-orange-600 transition-colors"
              >
                Order Now
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden mb-4 sm:mb-12 h-40 sm:h-64 lg:h-96 group bg-gray-900">
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;

            if (swipe < -10000) {
              setCurrentIndex((prev) => (prev + 1) % banners.length);
            } else if (swipe > 10000) {
              setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
            }
          }}
        >
          <img
            src={banners[currentIndex].imageUrl}
            alt={`Banner ${currentIndex + 1}`}
            className="w-full h-full object-cover opacity-80"
          />
          {/* Gradient Overlay for better text readability if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay - Always visible */}
      <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 lg:px-8 pointer-events-none">
         <div className="max-w-7xl mx-auto w-full text-center sm:text-left">
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Delicious Food Delivered
            </h1>
             <p className="mt-2 sm:mt-4 text-sm sm:text-xl text-gray-200 max-w-3xl hidden sm:block drop-shadow-md">
              Order your favorite meals from the best restaurants in town.
            </p>
             <div className="mt-3 sm:mt-8 pointer-events-auto inline-block">
              <Link
                to="/#menu"
                className="inline-flex items-center px-3 py-1.5 sm:px-8 sm:py-3 border border-transparent text-xs sm:text-base font-medium rounded-full text-gray-900 bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg"
              >
                Order Now
              </Link>
            </div>
         </div>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 shadow-sm ${
              index === currentIndex ? 'bg-orange-500 scale-125' : 'bg-white/70 hover:bg-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
