import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Address } from '../types';
import { Loader2, Plus, Trash2, Edit2, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddressBookProps {
  onSelect?: (address: Address) => void;
  selectedAddressId?: string;
  selectable?: boolean;
}

export const AddressBook: React.FC<AddressBookProps> = ({ onSelect, selectedAddressId, selectable = false }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    label: 'Home',
    houseNumber: '',
    area: '',
    city: '',
    pincode: '',
    state: '',
    country: '',
    isDefault: false
  });

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, 'users', user.uid, 'addresses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
      setAddresses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isDefault: e.target.checked }));
  };

  const resetForm = () => {
    setFormData({
      label: 'Home',
      houseNumber: '',
      area: '',
      city: '',
      pincode: '',
      state: '',
      country: '',
      isDefault: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    try {
      const addressesRef = collection(db, 'users', user.uid, 'addresses');
      
      // Check if this is the first address
      const snapshot = await getDocs(addressesRef);
      const isFirstAddress = snapshot.empty;
      
      const addressData = {
        ...formData,
        isDefault: isFirstAddress || formData.isDefault
      };

      // If setting as default, unset others
      if (addressData.isDefault && !isFirstAddress) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          if (doc.data().isDefault) {
            batch.update(doc.ref, { isDefault: false });
          }
        });
        await batch.commit();
      }

      if (editingId) {
        // If editing, we might need to handle default logic differently if it wasn't default before
        // But for simplicity, we'll just update it.
        // If we are setting it to default, we already unset others above.
        await updateDoc(doc(db, 'users', user.uid, 'addresses', editingId), addressData);
        toast.success('Address updated');
      } else {
        await addDoc(addressesRef, addressData);
        toast.success('Address added');
      }
      resetForm();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
      toast.success('Address deleted');
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error('Failed to delete address');
    }
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      houseNumber: address.houseNumber,
      area: address.area,
      city: address.city,
      pincode: address.pincode,
      state: address.state,
      country: address.country,
      isDefault: address.isDefault
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleSetDefault = async (id: string) => {
    if (!user || !db) return;
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'addresses'));
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isDefault: doc.id === id });
      });
      await batch.commit();
      toast.success('Default address updated');
    } catch (error) {
      console.error("Error setting default:", error);
      toast.error('Failed to update default address');
    }
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-orange-500" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            <Plus className="h-4 w-4" /> Add New
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <select
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">House No. / Flat</label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area / Street</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={handleCheckboxChange}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => (
          <div 
            key={addr.id} 
            className={`
              relative p-4 rounded-xl border transition-all cursor-pointer
              ${selectable && selectedAddressId === addr.id 
                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' 
                : 'border-gray-200 bg-white hover:border-orange-200'}
            `}
            onClick={() => selectable && onSelect && onSelect(addr)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase rounded flex items-center gap-1">
                    <Check className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
              {!selectable && (
                <div className="flex gap-2 items-center">
                  {deleteId === addr.id ? (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(null); }}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(addr); }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Address"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(addr.id); }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 items-start text-gray-600 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p>{addr.houseNumber}, {addr.area}</p>
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>{addr.country}</p>
              </div>
            </div>

            {!selectable && !addr.isDefault && (
              <button
                onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Set as Default
              </button>
            )}
          </div>
        ))}
        
        {addresses.length === 0 && !isAdding && (
          <div className="col-span-full text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p>No addresses saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
