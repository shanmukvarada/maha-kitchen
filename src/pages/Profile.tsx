import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AddressBook } from '../components/AddressBook';
import { User, Mail, Phone, Shield } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        phoneNumber: phone
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      // Note: In a real app, you'd also want to update the local user context state
      // or reload the page to reflect changes if they aren't listening to the doc.
      // Our AuthContext listens to auth state changes, but not necessarily the firestore doc for these fields 
      // unless we update the listener there. For now, this updates DB.
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-2 sm:mb-4">
                <User className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{user.displayName || 'User'}</h2>
              <p className="text-gray-500 text-xs sm:text-sm">{user.email}</p>
              {user.role === 'admin' && (
                <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{user.phoneNumber || 'No phone number added'}</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-2 sm:mt-4 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Address Book */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
            <AddressBook />
          </div>
        </div>
      </div>
    </div>
  );
};
