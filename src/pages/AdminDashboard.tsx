import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Order, Product } from '../types';
import { Loader2, Plus, Upload, X, Filter, MapPin, Settings, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { convertGoogleDriveLink } from '../lib/utils';
import { format } from 'date-fns';
import { ProductManagement } from '../components/ProductManagement';
import { BannerManager } from '../components/BannerManager';

interface Category {
  id: string;
  name: string;
}

export const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'banners'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // Product Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    image: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (!isAdmin) return;

    if (!import.meta.env.VITE_FIREBASE_API_KEY || !db) {
      setLoading(false);
      return;
    }

    // Fetch Orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    });

    // Fetch Categories
    const qCategories = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Category[];
      setCategories(categoriesData);
      
      // Set default category for new product if available
      if (categoriesData.length > 0 && !newProduct.category) {
        setNewProduct(prev => ({ ...prev, category: categoriesData[0].name }));
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCategories();
    };
  }, [isAdmin]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    if (!db) {
      toast.error("Database not available");
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !db) return;
    
    setAddingCategory(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      toast.success('Category added');
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure? This might affect products using this category.') || !db) return;
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
      toast.success('Category deleted');
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      toast.error("Database not available");
      return;
    }
    setUploading(true);

    try {
      let imageUrl = newProduct.imageUrl;
      
      // Handle file upload if selected
      if (imageSource === 'upload' && newProduct.image && storage) {
        const storageRef = ref(storage, `products/${Date.now()}_${newProduct.image.name}`);
        const snapshot = await uploadBytes(storageRef, newProduct.image);
        imageUrl = await getDownloadURL(snapshot.ref);
      } else if (imageSource === 'url' && imageUrl) {
        // Process URL (e.g. Google Drive)
        imageUrl = convertGoogleDriveLink(imageUrl);
      }

      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category || (categories.length > 0 ? categories[0].name : 'Uncategorized'),
        imageUrl,
        createdAt: serverTimestamp()
      });

      toast.success('Product added successfully');
      setIsAddingProduct(false);
      setNewProduct({ 
        name: '', 
        description: '', 
        price: '', 
        category: categories.length > 0 ? categories[0].name : '', 
        imageUrl: '', 
        image: null 
      });
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600">You must be an admin to view this page.</p>
      </div>
    );
  }

  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Firebase Not Configured</h2>
        <p className="text-gray-600 mt-2">Please add your Firebase configuration to .env to access admin features.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant operations</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'banners' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ImageIcon className="h-4 w-4" />
            Banners
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Orders</h3>
          <p className="text-lg sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{orders.length}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Revenue</h3>
          <p className="text-lg sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            ₹{orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pending</h3>
          <p className="text-lg sm:text-3xl font-bold text-yellow-500 mt-1 sm:mt-2">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Delivered</h3>
          <p className="text-lg sm:text-3xl font-bold text-green-500 mt-1 sm:mt-2">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="out-for-delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Order Details</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer / Address</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                        <div className="text-xs text-gray-400 mt-1">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'MMM d, h:mm a') : 'Just now'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{order.userEmail}</div>
                        {order.address && (
                          <div className="flex items-start gap-1 mt-1 text-xs text-gray-500 max-w-[200px]">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>
                              {order.address.houseNumber}, {order.address.area}, {order.address.city}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                        {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                          ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' : 
                            order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 
                            order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {order.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                          className="block w-full pl-2 pr-8 py-1 text-xs border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 rounded-md bg-gray-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="out-for-delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No orders found matching the filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Product Management</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsManagingCategories(true)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Categories</span>
              </button>
              <button
                onClick={() => setIsAddingProduct(true)}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Add Product
              </button>
            </div>
          </div>

          <ProductManagement />

          {isAddingProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-5 sm:p-8 max-w-md w-full relative shadow-xl animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={() => setIsAddingProduct(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">Add New Product</h2>
                <form onSubmit={handleAddProduct} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      required
                      placeholder="e.g. Margherita Pizza"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      rows={3}
                      required
                      placeholder="Describe the delicious details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        required
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      >
                        {categories.length === 0 && <option value="">No categories</option>}
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="imageSource" 
                          checked={imageSource === 'upload'} 
                          onChange={() => setImageSource('upload')}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        Upload File
                      </label>
                      <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                        <input 
                          type="radio" 
                          name="imageSource" 
                          checked={imageSource === 'url'} 
                          onChange={() => setImageSource('url')}
                          className="text-orange-500 focus:ring-orange-500"
                        />
                        Image URL
                      </label>
                    </div>

                    {imageSource === 'upload' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-orange-500 transition-colors cursor-pointer relative bg-gray-50 hover:bg-orange-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => setNewProduct({...newProduct, image: e.target.files ? e.target.files[0] : null})}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          <span className="text-xs sm:text-sm font-medium">
                            {newProduct.image ? (
                              <span className="text-orange-600">{newProduct.image.name}</span>
                            ) : (
                              'Click to upload image'
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={newProduct.imageUrl}
                        onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        placeholder="https://example.com/image.jpg or Google Drive Link"
                      />
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 sm:py-3 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50 mt-2 text-sm sm:text-base"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : 'Add Product'}
                  </button>
                </form>
              </div>
            </div>
          )}
          {/* Manage Categories Modal */}
          {isManagingCategories && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-5 sm:p-8 max-w-sm w-full relative shadow-xl animate-in fade-in zoom-in duration-200">
                <button 
                  onClick={() => setIsManagingCategories(false)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900">Manage Categories</h2>
                
                <div className="space-y-4">
                  <form onSubmit={handleAddCategory} className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingCategory || !newCategoryName.trim()}
                      className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {addingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </form>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No categories yet.</p>
                    ) : (
                      categories.map(category => (
                        <div key={category.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'banners' && (
        <BannerManager />
      )}
    </div>
  );
};
