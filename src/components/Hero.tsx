import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const Hero = () => {
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
};
