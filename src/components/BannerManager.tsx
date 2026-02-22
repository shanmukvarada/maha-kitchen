import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Loader2, Trash2, Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Banner {
  id: string;
  imageUrl: string;
  createdAt: any;
}

export const BannerManager = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [inputType, setInputType] = useState<'upload' | 'url'>('url');

  useEffect(() => {
    if (!db) return;

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

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerUrl.trim() || !db) return;

    setUploading(true);
    try {
      // Convert Google Drive links if needed
      let finalUrl = newBannerUrl;
      if (finalUrl.includes('drive.google.com')) {
        const idMatch = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
          finalUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
      }

      await addDoc(collection(db, 'banners'), {
        imageUrl: finalUrl,
        createdAt: serverTimestamp()
      });
      toast.success('Banner added successfully');
      setNewBannerUrl('');
    } catch (error) {
      console.error("Error adding banner:", error);
      toast.error('Failed to add banner');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !storage || !db) return;

    setUploading(true);
    const files = Array.from(e.target.files) as File[];

    try {
      for (const file of files) {
        const storageRef = ref(storage, `banners/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(snapshot.ref);

        await addDoc(collection(db, 'banners'), {
          imageUrl,
          createdAt: serverTimestamp()
        });
      }
      toast.success('Banners uploaded successfully');
    } catch (error) {
      console.error("Error uploading banners:", error);
      toast.error('Failed to upload banners');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm('Are you sure you want to delete this banner?') || !db || !storage) return;

    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'banners', banner.id));

      // 2. Delete from Storage (try/catch in case it's an external URL)
      try {
        const imageRef = ref(storage, banner.imageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.warn("Could not delete image from storage (might be external URL):", storageError);
      }

      toast.success('Banner deleted');
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error('Failed to delete banner');
    }
  };

  if (loading) return <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage Banners</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg self-start">
            <button
              onClick={() => setInputType('url')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${inputType === 'url' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              URL
            </button>
            <button
              onClick={() => setInputType('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${inputType === 'upload' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Upload
            </button>
          </div>

          {inputType === 'url' ? (
            <form onSubmit={handleAddUrl} className="flex gap-2 w-full sm:w-80">
              <input
                type="text"
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                placeholder="Image URL (e.g. Google Drive link)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                disabled={uploading}
              />
              <button
                type="submit"
                disabled={uploading || !newBannerUrl.trim()}
                className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center min-w-[40px]"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <button 
                className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Images
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-50">
            <img 
              src={banner.imageUrl} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => handleDelete(banner)}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors transform scale-90 group-hover:scale-100"
                title="Delete Banner"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p>No banners uploaded yet.</p>
            <p className="text-sm mt-1">Upload images to display in the home page carousel.</p>
          </div>
        )}
      </div>
    </div>
  );
};
