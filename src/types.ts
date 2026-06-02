export interface User {
  id: string;
  name: string;
  email: string;
  branch?: string;
  role: 'student' | 'admin';
  interests?: string[];
  approved?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  department: string;
  description: string;
  rating: number;
  totalCopies: number;
  availableCopies: number;
  category: string;
  location: string;
}

export interface IssueRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  requestDate: string;
  dueDate?: string;
  returnDate?: string;
  durationDays: number;
  status: 'pending' | 'approved' | 'returned' | 'renewal_pending' | 'rejected';
  fine: number;
}

export interface Feedback {
  id: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  category: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'admin';
  action: string;
  details: string;
  ipAddress?: string;
}

export interface RoadmapStage {
  stageName: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  topics: {
    id: string;
    name: string;
    completed: boolean;
  }[];
  resources: {
    title: string;
    url: string;
    type: 'Youtube Playlist' | 'Official Documentation' | 'Free Course' | 'Article' | 'Practice Platform' | 'Website';
  }[];
  projects: string[];
}

export interface UserRoadmap {
  id: string;
  studentId: string;
  skillName: string;
  stages: RoadmapStage[];
  progressPercent: number;
  lastUpdated: string;
}
