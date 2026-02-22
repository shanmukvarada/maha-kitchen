import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { Loader2, Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const statusIcons = {
  'pending': <Clock className="h-5 w-5 text-yellow-500" />,
  'preparing': <Package className="h-5 w-5 text-blue-500" />,
  'out-for-delivery': <Truck className="h-5 w-5 text-purple-500" />,
  'delivered': <CheckCircle className="h-5 w-5 text-green-500" />,
  'cancelled': <XCircle className="h-5 w-5 text-red-500" />
};

const statusLabels = {
  'pending': 'Pending',
  'preparing': 'Preparing',
  'out-for-delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled'
};

export const UserDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Check if Firebase config is present
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !db) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
      // orderBy('createdAt', 'desc') // Removed to avoid needing a composite index for this demo
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort client-side
      ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Firebase Not Configured</h2>
        <p className="text-gray-600 mt-2">Please add your Firebase configuration to .env to view orders.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No orders yet</h2>
        <p className="text-gray-600 mt-2">Start ordering some delicious food!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Order History</h1>
      <div className="space-y-3 sm:space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 sm:mb-4 gap-2 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Just now'}
                </p>
              </div>
              <div className="flex items-center gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gray-50 border border-gray-200">
                {React.cloneElement(statusIcons[order.status], { className: "h-4 w-4 sm:h-5 sm:w-5" })}
                <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                  {statusLabels[order.status]}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-2 sm:pt-4 mt-2 sm:mt-4">
              <ul className="space-y-1 sm:space-y-2">
                {order.items?.map((item, index) => (
                  <li key={index} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-gray-900">
                      ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                    </span>
                  </li>
                )) || <li className="text-xs sm:text-sm text-gray-500">No items found</li>}
              </ul>
              <div className="flex justify-between items-center mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                <span className="font-bold text-gray-900 text-sm sm:text-base">Total</span>
                <span className="font-bold text-orange-500 text-base sm:text-lg">
                  ₹{(order.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
