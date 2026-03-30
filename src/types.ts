import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

export type BookingStatus = 'pending' | 'in-progress' | 'completed' | 'delivered';

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  device: string;
  issue: string;
  price: number;
  status: BookingStatus;
  assignedTo?: string;
  createdAt: Timestamp;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  history: string[]; // Array of booking IDs
}

export interface AILog {
  id: string;
  command: string;
  action: string;
  result: string;
  timestamp: Timestamp;
}

export interface Task {
  id: string;
  userId?: string;
  command: string;
  status: 'pending' | 'completed';
  createdAt: Timestamp;
}
