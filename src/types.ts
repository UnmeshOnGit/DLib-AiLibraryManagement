export type UserRole = 'student' | 'admin';

export interface ProgressGoal {
  id: string;
  type: 'weekly' | 'monthly';
  description: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string; // Optional for admin
  department: string;
  year?: string;      // 1st, 2nd, 3rd, 4th, or N/A
  role: UserRole;
  passwordHash: string;
  readingStreak: number;
  lastReadingActivityDate?: string; // YYYY-MM-DD
  streakPoints: number;
  badges: string[];
  favoriteCategories: string[];
  favoriteAuthors: string[];
  interests: string[];
  goals: ProgressGoal[];
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  subject: string;
  department: string;
  publisher: string;
  language: string;
  edition: string;
  description: string;
  coverImage: string;
  quantity: number;
  availableCopies: number;
  ratings: number[]; // Array of star values (1-5)
  ratingValue: number; // Computed average
  popularity: number; // Times checked out
  addedAt: string;
}

export type IssueStatus = 'pending' | 'approved' | 'rejected' | 'issued' | 'returned';

export interface IssueRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  requestDate: string;
  approveDate?: string;
  issueDate?: string;
  dueDate?: string;
  returnDate?: string;
  status: IssueStatus;
  fineAmount: number;
  finePaid: boolean;
  isRenewed: boolean;
  comments?: string;
  qrCodeIssued?: boolean; // Mock visual flag for QR system is true
}

export type ReservationStatus = 'waiting' | 'available' | 'notified' | 'cancelled';

export interface ReservationRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  requestDate: string;
  queuePosition: number;
  status: ReservationStatus;
  notifiedAt?: string;
}

export interface ResourceItem {
  title: string;
  url: string;
  platform?: string;
}

export interface ProjectIdea {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface RoadmapResources {
  youtube: ResourceItem[];
  docs: ResourceItem[];
  courses: ResourceItem[];
  articles: ResourceItem[];
  practice: ResourceItem[];
  github: ResourceItem[];
  books: ResourceItem[];
  projects: ProjectIdea[];
}

export interface RoadmapTopic {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
}

export interface RoadmapStage {
  id: string;
  name: 'Beginner' | 'Intermediate' | 'Advanced' | 'Real Projects';
  topics: RoadmapTopic[];
  goals: string[];
  resources: RoadmapResources;
}

export interface Roadmap {
  id: string;
  studentId: string;
  skillName: string;
  status: 'active' | 'completed';
  progress: number; // Percent completed
  stages: RoadmapStage[];
  completedTopics: string[]; // Topic IDs list
  createdAt: string;
  completedAt?: string;
}

export interface HelpQuery {
  id: string;
  studentId: string;
  queryText: string;
  responseText: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'library' | 'learning' | 'alert' | 'system';
}

export interface StudyPlannerEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  start: string; // ISO date string or HH:MM
  end: string;
  dayOfWeek?: number; // 0-6 for recurring, or solid date
  date?: string; // YYYY-MM-DD for single-instance
  completed: boolean;
  color?: string; // Hex color
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  studentId: string;
  department: string;
  streakPoints: number;
  readingStreak: number;
  badgesCount: number;
  badges?: string[];
}
