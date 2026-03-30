import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "staff" | "user";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  preferences?: Record<string, any>;
}

export interface Task {
  id: string;
  userId: string;
  command: string;
  status: "pending" | "completed";
  createdAt: Timestamp;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  device: string;
  issue?: string;
  status: "received" | "in-progress" | "completed" | "delivered";
  createdAt: Timestamp;
}

export interface GMBUpdate {
  id: string;
  type: "post" | "review" | "reply" | "update";
  content: string;
  status: string;
  timestamp: Timestamp;
}

export interface Log {
  id: string;
  action: string;
  result: string;
  timestamp: Timestamp;
}
