import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { convertGoogleDriveLink } from '../lib/utils';
import { Loader2, Trash2, Edit2, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    // Fetch Products
    const qProducts = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
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
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, []);

  const handleDelete = async () => {
    if (!deletingId || !db) return;
    try {
      await deleteDoc(doc(db, 'products', deletingId));
      toast.success('Product deleted');
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error('Failed to delete product');
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !db) return;
    try {
      const imageUrl = editForm.imageUrl ? convertGoogleDriveLink(editForm.imageUrl) : '';
      
      await updateDoc(doc(db, 'products', editingId), {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        category: editForm.category,
        imageUrl: imageUrl
      });
      toast.success('Product updated');
      setEditingId(null);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error('Failed to update product');
    }
  };

  if (loading) return <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Image</th>
              <th className="px-6 py-4 font-medium text-gray-500">Name</th>
              <th className="px-6 py-4 font-medium text-gray-500">Category</th>
              <th className="px-6 py-4 font-medium text-gray-500">Price</th>
              <th className="px-6 py-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <div className="space-y-2">
                       <input
                        type="text"
                        value={editForm.imageUrl || ''}
                        onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Image URL"
                      />
                      <img 
                        src={editForm.imageUrl || ''} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                      />
                    </div>
                  ) : (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Name"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Description"
                        rows={2}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === product.id ? (
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm({...editForm, category: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                      className="w-24 px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    `₹${(product.price || 0).toFixed(2)}`
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {editingId === product.id ? (
                      <>
                        <button 
                          onClick={saveEdit}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(product)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeletingId(product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-3 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            {editingId === product.id ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img 
                      src={editForm.imageUrl || ''} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={e => setEditForm({...editForm, price: Number(e.target.value)})}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Price"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={editForm.imageUrl || ''}
                  onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Image URL"
                />
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                  placeholder="Description"
                  rows={2}
                />
                <select
                  value={editForm.category}
                  onChange={e => setEditForm({...editForm, category: e.target.value})}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={saveEdit}
                    className="flex-1 bg-green-500 text-white py-1.5 rounded text-sm font-medium"
                  >
                    Save
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-gray-900">₹{(product.price || 0).toFixed(2)}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(product)}
                        className="p-1.5 text-blue-600 bg-blue-50 rounded-md"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingId(product.id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
