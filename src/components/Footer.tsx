import React from 'react';
import { Phone, Mail, MessageCircle, Heart, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <>
      <footer className="bg-gray-900 text-white py-6 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
            
            {/* Column 1: Brand & About - Full width on mobile */}
            <div className="col-span-2 md:col-span-1 text-center md:text-left border-b border-gray-800 md:border-none pb-4 md:pb-0">
              <h3 className="text-lg font-bold text-orange-500 mb-2">Maha Kitchens</h3>
              <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto md:mx-0 leading-relaxed">
                Delivering authentic flavors and premium quality food straight to your doorstep.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="text-left pl-2 md:pl-0">
              <h3 className="text-base font-semibold mb-2 text-white">Links</h3>
              <ul className="space-y-1.5 text-gray-400 text-xs md:text-sm">
                <li><Link to="/" className="hover:text-orange-500 transition-colors">Home</Link></li>
                <li><Link to="/profile" className="hover:text-orange-500 transition-colors">Profile</Link></li>
                <li><Link to="/cart" className="hover:text-orange-500 transition-colors">Cart</Link></li>
              </ul>
            </div>

            {/* Column 3: Customer Support */}
            <div className="text-left">
              <h3 className="text-base font-semibold mb-2 text-white">Contact</h3>
              <ul className="space-y-2 text-gray-400 text-xs md:text-sm">
                <li>
                  <a href="tel:+919491541348" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                    <Phone className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    <span>+91 94915 41348</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:mahakitchen485@gmail.com" className="flex items-center gap-1.5 hover:text-white transition-colors group">
                    <Mail className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    <span className="break-all">mahakitchen485@gmail.com</span>
                  </a>
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                  <span>9AM - 10PM</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 mt-2 text-center">
            <p className="text-gray-500 text-xs flex items-center justify-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-current" /> by Maha Kitchens
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919491541348" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </>
  );
};
