export interface Address {
  id: string;
  label: string; // Home, Work, etc.
  houseNumber: string;
  area: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  role: 'admin' | 'user';
  photoURL: string | null;
  profileCompleted?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  createdAt: any; // Firestore Timestamp
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  createdAt: any; // Firestore Timestamp
  address: Address; // Snapshot of the address
}

export type OrderStatus = Order['status'];
