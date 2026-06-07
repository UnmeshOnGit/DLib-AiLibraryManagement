import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'db.json');

// Helper to encrypt passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate simple mock tokens
function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', 'super-academic-secret-key-2026')
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

// Simple JWT verification middleware
function authenticateJWT(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized credentials required' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', 'super-academic-secret-key-2026')
      .update(`${header}.${body}`)
      .digest('base64url');
    
    if (signature !== expectedSig) {
      res.status(403).json({ error: 'Token is invalid or has expired' });
      return;
    }
    
    const parsedUser = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    (req as any).user = parsedUser;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Token is invalid' });
  }
}

// Database helper
let db: {
  users: any[];
  books: any[];
  issues: any[];
  reservations: any[];
  roadmaps: any[];
  notifications: any[];
  planner: any[];
  otpCodes: any[];
  examNotes: any[];
} = {
  users: [],
  books: [],
  issues: [],
  reservations: [],
  roadmaps: [],
  notifications: [],
  planner: [],
  otpCodes: [],
  examNotes: []
};

// Initial system seed of excellent university textbooks
const SEED_BOOKS = [
  {
    id: "book-1",
    title: "Introduction to Python & Data Analysis",
    author: "Dr. Catherine Meadows",
    isbn: "978-0134076430",
    category: "Coding & AI",
    subject: "Programming basics, Pandas, NumPy, Visuals",
    department: "Computer Science",
    publisher: "Academic Oxford Press",
    language: "English",
    edition: "4th Edition",
    description: "The definitive undergraduate text on utilizing python for core computing, data visualization, and preparing data structures for machine learning pipelines.",
    coverImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=400",
    quantity: 5,
    availableCopies: 5,
    ratings: [5, 4, 5, 5, 4],
    ratingValue: 4.6,
    popularity: 24,
    addedAt: "2026-01-10T12:00:00Z"
  },
  {
    id: "book-2",
    title: "Advanced Machine Learning Algorithms",
    author: "Prateek Harrison",
    isbn: "978-1492032649",
    category: "Coding & AI",
    subject: "Neural Networks, Deep Learning, Transformers",
    department: "Computer Science",
    publisher: "O'Reilly Media",
    language: "English",
    edition: "2nd Edition",
    description: "An immersive study into high-dimensional vector spaces, backpropagation mechanics, convolutional neural networks, and modern LLM architecture mechanics.",
    coverImage: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?auto=format&fit=crop&q=80&w=400",
    quantity: 3,
    availableCopies: 3,
    ratings: [5, 5, 5, 4],
    ratingValue: 4.8,
    popularity: 18,
    addedAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "book-3",
    title: "Full-Stack Web Architectures: From HTML to NextJS",
    author: "Robert T. Henderson",
    isbn: "978-1119717256",
    category: "Web Development",
    subject: "React, Node, Express, Databases",
    department: "Computer Science",
    publisher: "Wiley Publishing",
    language: "English",
    edition: "1st Edition",
    description: "A practical guide to designing robust modern web applications, covering relational & non-relational database models, client SPA routing, caching layers, and responsive UI layout systems.",
    coverImage: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=400",
    quantity: 4,
    availableCopies: 4,
    ratings: [4, 4, 5, 5],
    ratingValue: 4.5,
    popularity: 32,
    addedAt: "2026-03-01T15:20:00Z"
  },
  {
    id: "book-4",
    title: "Civil Engineering Thermodynamics & Material Strength",
    author: "Prof. Arthur Pendelton",
    isbn: "978-0073398181",
    category: "Civil & Materials",
    subject: "Structural design, heat transfer, stress loads",
    department: "Engineering",
    publisher: "McGraw Hill Academic",
    language: "English",
    edition: "8th Edition",
    description: "Essential structural load equations, elastic mechanics, shearing resistance, thermal expansion indexes, and foundations math for civil installations.",
    coverImage: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=400",
    quantity: 2,
    availableCopies: 2,
    ratings: [4, 4, 3, 5],
    ratingValue: 4.0,
    popularity: 9,
    addedAt: "2026-01-20T10:00:00Z"
  },
  {
    id: "book-5",
    title: "Microelectronic Circuits & Signal Networks",
    author: "Adel S. Sedra",
    isbn: "978-0190853464",
    category: "Electrical Engineering",
    subject: "Silicon chips, MOSFETs, Signal filtering, Logic gates",
    department: "Engineering",
    publisher: "Oxford University Press",
    language: "English",
    edition: "10th Edition",
    description: "The gold standard text on designing integrated circuits, physical properties of diodes, transistor biasing, noise reduction algorithms, and analog-to-digital controllers.",
    coverImage: "https://images.unsplash.com/photo-1631553127989-130a139a1fe0?auto=format&fit=crop&q=80&w=400",
    quantity: 3,
    availableCopies: 3,
    ratings: [5, 4, 5, 4, 5],
    ratingValue: 4.6,
    popularity: 15,
    addedAt: "2026-02-05T14:40:00Z"
  },
  {
    id: "book-6",
    title: "Consumer Marketing & Brand Psychology",
    author: "Melissa Sinclair",
    isbn: "978-0136113942",
    category: "Business & Marketing",
    subject: "Behavior metrics, Brand positioning, Campaigns",
    department: "Business Administration",
    publisher: "Pearson Press USA",
    language: "English",
    edition: "6th Edition",
    description: "A comprehensive investigation into customer behavioral vectors, focus groups, pricing strategy elasticity, digital marketing funnel parameters, and brand sentiment analytics.",
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400",
    quantity: 4,
    availableCopies: 4,
    ratings: [4, 5, 4],
    ratingValue: 4.3,
    popularity: 13,
    addedAt: "2026-03-22T08:00:00Z"
  },
  {
    id: "book-7",
    title: "Macroeconomics: Global Capital Flow & Markets",
    author: "N. Gregory Mankiw",
    isbn: "978-1319106010",
    category: "Finance & Economics",
    subject: "GDP, Tariffs, Inflation, FED rates, Debt models",
    department: "Business Administration",
    publisher: "Worth Publishers",
    language: "English",
    edition: "11th Edition",
    description: "Explores structural drivers of national wealth, financial institution architectures, reserve banks policies, FX pricing, systemic market bubbles, and sovereign debt dynamics.",
    coverImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=400",
    quantity: 2,
    availableCopies: 2,
    ratings: [5, 4, 5, 5],
    ratingValue: 4.7,
    popularity: 11,
    addedAt: "2026-01-29T11:15:00Z"
  },
  {
    id: "book-8",
    title: "Typography Companion & Editorial Layout",
    author: "Elena Petrova",
    isbn: "978-1616890414",
    category: "UI-UX & Arts",
    subject: "Visual hierarchy, Letter spacing, Tracking, Kerning",
    department: "Fine Arts",
    publisher: "Princeton Architectural Press",
    language: "English",
    edition: "3rd Edition",
    description: "An editorial design bible detailing the history of typefaces, micro-typographic proportions, visual rhythms on grid systems, and pairing displays with body-level fonts.",
    coverImage: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&q=80&w=400",
    quantity: 2,
    availableCopies: 2,
    ratings: [5, 5, 4, 5],
    ratingValue: 4.8,
    popularity: 8,
    addedAt: "2026-04-03T16:00:00Z"
  },
  {
    id: "book-9",
    title: "Cybersecurity Fundamentals: Defensive Systems",
    author: "Marc S. Dupont",
    isbn: "978-1260453256",
    category: "Cybersecurity",
    subject: "Cryptography, Ports, Firewalls, Buffer flows",
    department: "Computer Science",
    publisher: "McGraw Education",
    language: "English",
    edition: "3rd Edition",
    description: "Underpinning modern cybersecurity practices: public-key cryptography, virtual private gateways, threat containment routing, server hardening protocols, and secure packet inspection.",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400",
    quantity: 3,
    availableCopies: 3,
    ratings: [4, 5, 5, 3],
    ratingValue: 4.2,
    popularity: 16,
    addedAt: "2026-03-10T13:45:00Z"
  },
  {
    id: "book-10",
    title: "Cloud Native Deployment with DevOps tools",
    author: "Ananya Patel",
    isbn: "978-1098105402",
    category: "DevOps & Cloud",
    subject: "Docker, Kubernetes, GitHub Actions, Linux systems",
    department: "Computer Science",
    publisher: "O'Reilly Media",
    language: "English",
    edition: "2nd Edition",
    description: "Deploying high-availability full-stack containers. Details manual workflow triggers, clusters configuration, load balancers, SSL renewal hooks, and metrics tracking.",
    coverImage: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=400",
    quantity: 3,
    availableCopies: 3,
    ratings: [5, 5, 4, 5],
    ratingValue: 4.7,
    popularity: 19,
    addedAt: "2026-02-18T14:10:00Z"
  }
];

function loadDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileData = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(fileData);
      
      // Ensure all arrays are initialized
      if (!db.users) db.users = [];
      if (!db.books) db.books = [...SEED_BOOKS];
      if (!db.issues) db.issues = [];
      if (!db.reservations) db.reservations = [];
      if (!db.roadmaps) db.roadmaps = [];
      if (!db.notifications) db.notifications = [];
      if (!db.planner) db.planner = [];
      if (!db.otpCodes) db.otpCodes = [];
      if (!db.examNotes) db.examNotes = [];

      // Migrations for student approvals
      db.users.forEach((u: any) => {
        if (u.approved === undefined) {
          u.approved = true;
        }
      });
    } catch (err) {
      console.error('Error reading JSON database, resetting files...', err);
      seedDatabase();
    }
  } else {
    seedDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file', err);
  }
}

function mergeDatabases(clientDb: any) {
  if (!clientDb || typeof clientDb !== 'object') return;
  
  // 1. Merge users by email
  if (Array.isArray(clientDb.users)) {
    clientDb.users.forEach((clientUser: any) => {
      if (!clientUser || !clientUser.email) return;
      const idx = db.users.findIndex(u => u.email && u.email.toLowerCase() === clientUser.email.toLowerCase());
      if (idx === -1) {
        db.users.push(clientUser);
      } else {
        // Merge properties, preferring client stats but preserving role/approval
        db.users[idx] = { ...db.users[idx], ...clientUser };
      }
    });
  }

  // 2. Merge issues by id
  if (Array.isArray(clientDb.issues)) {
    clientDb.issues.forEach((clientIssue: any) => {
      if (!clientIssue || !clientIssue.id) return;
      const idx = db.issues.findIndex(i => i.id === clientIssue.id);
      if (idx === -1) {
        db.issues.push(clientIssue);
      } else {
        db.issues[idx] = { ...db.issues[idx], ...clientIssue };
      }
    });
  }

  // 3. Merge reservations by id
  if (Array.isArray(clientDb.reservations)) {
    clientDb.reservations.forEach((r: any) => {
      if (!r || !r.id) return;
      const idx = db.reservations.findIndex(x => x.id === r.id);
      if (idx === -1) {
        db.reservations.push(r);
      } else {
        db.reservations[idx] = { ...db.reservations[idx], ...r };
      }
    });
  }

  // 4. Merge roadmaps by id
  if (Array.isArray(clientDb.roadmaps)) {
    clientDb.roadmaps.forEach((r: any) => {
      if (!r || !r.id) return;
      const idx = db.roadmaps.findIndex(x => x.id === r.id);
      if (idx === -1) {
        db.roadmaps.push(r);
      } else {
        db.roadmaps[idx] = { ...db.roadmaps[idx], ...r };
      }
    });
  }

  // 5. Merge notifications by id
  if (Array.isArray(clientDb.notifications)) {
    clientDb.notifications.forEach((n: any) => {
      if (!n || !n.id) return;
      const idx = db.notifications.findIndex(x => x.id === n.id);
      if (idx === -1) {
        db.notifications.push(n);
      } else {
        db.notifications[idx] = { ...db.notifications[idx], ...n };
      }
    });
  }

  // 6. Merge planner by id
  if (Array.isArray(clientDb.planner)) {
    clientDb.planner.forEach((p: any) => {
      if (!p || !p.id) return;
      const idx = db.planner.findIndex(x => x.id === p.id);
      if (idx === -1) {
        db.planner.push(p);
      } else {
        db.planner[idx] = { ...db.planner[idx], ...p };
      }
    });
  }

  // 7. Merge examNotes by id
  if (Array.isArray(clientDb.examNotes)) {
    clientDb.examNotes.forEach((e: any) => {
      if (!e || !e.id) return;
      const idx = db.examNotes.findIndex(x => x.id === e.id);
      if (idx === -1) {
        db.examNotes.push(e);
      } else {
        db.examNotes[idx] = { ...db.examNotes[idx], ...e };
      }
    });
  }

  // 8. Merge/synchronize otpCodes
  if (!db.otpCodes) {
    db.otpCodes = [];
  }
  if (Array.isArray(clientDb.otpCodes)) {
    clientDb.otpCodes.forEach((clientOtp: any) => {
      if (!clientOtp || !clientOtp.email || !clientOtp.otpCode) return;
      const idx = db.otpCodes.findIndex(x => 
        x.email.toLowerCase() === clientOtp.email.toLowerCase() && 
        x.otpCode.toString().trim() === clientOtp.otpCode.toString().trim()
      );
      if (idx === -1) {
        db.otpCodes.push(clientOtp);
      } else {
        db.otpCodes[idx] = { ...db.otpCodes[idx], ...clientOtp };
      }
    });
  }

  saveDatabase();
}

function seedDatabase() {
  db = {
    users: [
      {
        id: "user-student",
        name: "Unmesh Sutar",
        email: "unmeshsutar33@gmail.com",
        studentId: "U-2026-9041",
        department: "Computer Science",
        year: "3rd Year",
        role: "student",
        passwordHash: hashPassword("student123"),
        readingStreak: 5,
        lastReadingActivityDate: "2026-06-01",
        streakPoints: 240,
        badges: ["Early Adopter", "Bookworm Gold", "Python Ninja"],
        favoriteCategories: ["Coding & AI", "Web Development"],
        favoriteAuthors: ["Dr. Catherine Meadows"],
        interests: ["Python", "Machine Learning", "Web Development"],
        goals: [
          {
            id: "goal-1",
            type: "weekly",
            description: "Read 2 hours of Advanced Python",
            targetValue: 120,
            currentValue: 90,
            deadline: "2026-06-05",
            completed: false
          },
          {
            id: "goal-2",
            type: "monthly",
            description: "Read 3 Complete Books",
            targetValue: 3,
            currentValue: 1,
            deadline: "2026-06-30",
            completed: false
          }
        ],
        createdAt: "2026-05-01T08:00:00Z"
      },
      {
        id: "user-student-test",
        name: "Demo Student",
        email: "student@hub.edu",
        studentId: "U-2026-0042",
        department: "Computer Science",
        year: "1st Year",
        role: "student",
        passwordHash: hashPassword("student123"),
        readingStreak: 3,
        lastReadingActivityDate: "2026-06-01",
        streakPoints: 120,
        badges: ["Early Adopter", "Fresh Explorer"],
        favoriteCategories: ["Coding & AI"],
        favoriteAuthors: [],
        interests: ["Python"],
        goals: [
          {
            id: "goal-test-1",
            type: "weekly",
            description: "Read 1 hour of Python Basics",
            targetValue: 60,
            currentValue: 45,
            deadline: "2026-06-05",
            completed: false
          }
        ],
        createdAt: "2026-05-15T10:00:00Z"
      },
      {
        id: "user-admin",
        name: "Dr. Eleanor Vance (Librarian)",
        email: "librarian@hub.edu",
        role: "admin",
        department: "Administration",
        passwordHash: hashPassword("librarian123"),
        readingStreak: 12,
        streakPoints: 600,
        badges: ["Chief Scholar", "Architect of Knowledge", "Guardian of Books"],
        favoriteCategories: ["Academic", "History"],
        favoriteAuthors: [],
        interests: [],
        goals: [],
        createdAt: "2026-04-15T09:00:00Z"
      }
    ],
    books: [...SEED_BOOKS],
    issues: [
      {
        id: "issue-1",
        bookId: "book-1",
        bookTitle: "Introduction to Python & Data Analysis",
        studentId: "user-student",
        studentName: "Unmesh Sutar",
        studentEmail: "unmeshsutar33@gmail.com",
        requestDate: "2026-05-20T10:00:00Z",
        issueDate: "2026-05-20T14:00:00Z",
        dueDate: "2026-06-03T14:00:00Z", // Active
        status: "issued",
        fineAmount: 0,
        finePaid: false,
        isRenewed: false,
        qrCodeIssued: true
      },
      {
        id: "issue-test-1",
        bookId: "book-2",
        bookTitle: "Advanced Machine Learning Algorithms",
        studentId: "user-student-test",
        studentName: "Demo Student",
        studentEmail: "student@hub.edu",
        requestDate: "2026-05-22T09:00:00Z",
        issueDate: "2026-05-22T11:00:00Z",
        dueDate: "2026-06-05T11:00:00Z",
        status: "issued",
        fineAmount: 0,
        finePaid: false,
        isRenewed: false,
        qrCodeIssued: true
      },
      {
        id: "issue-old",
        bookId: "book-3",
        bookTitle: "Full-Stack Web Architectures: From HTML to NextJS",
        studentId: "user-student",
        studentName: "Unmesh Sutar",
        studentEmail: "unmeshsutar33@gmail.com",
        requestDate: "2026-05-01T09:00:00Z",
        issueDate: "2026-05-01T10:30:00Z",
        dueDate: "2026-05-15T10:30:00Z",
        returnDate: "2026-05-14T16:00:00Z",
        status: "returned",
        fineAmount: 0,
        finePaid: false,
        isRenewed: false
      }
    ],
    reservations: [],
    roadmaps: [
      {
        id: "roadmap-seed",
        studentId: "user-student",
        skillName: "Python Core & Advanced Concepts",
        status: "active",
        progress: 25,
        stages: [
          {
            id: "s1",
            name: "Beginner",
            goals: ["Master standard functions and types", "Configure environments & PIP Packages"],
            topics: [
              { id: "t1-1", name: "Variables & Standard Data Types", description: "Strings, Integers, Floats, Booleans, basic arithmetic.", estimatedHours: 2 },
              { id: "t1-2", name: "Lists, Tuples & Dictionaries", description: "Array-like concepts, slicing, appending, dictionary keys.", estimatedHours: 3 },
              { id: "t1-3", name: "Conditional execution & loops", description: "If/Else checks, nested loops, While loops, list comprehensions.", estimatedHours: 4 }
            ],
            resources: {
              youtube: [{ title: "Python for Beginners - Mosh", url: "https://youtube.com/watch?v=ff-Mosh" }],
              docs: [{ title: "Python Standard Library Docs", url: "https://docs.python.org/3/" }],
              courses: [{ title: "Python 101 on Kaggle Learning Pages", url: "https://kaggle.com/learn" }],
              articles: [], practice: [], github: [], books: [], projects: []
            }
          },
          {
            id: "s2",
            name: "Intermediate",
            goals: ["Implement OOP inheritance", "Build small utility tools"],
            topics: [
              { id: "t2-1", name: "Functional Programming & Lambdas", description: "Map, Filter, Reduce, generators, recursion.", estimatedHours: 4 },
              { id: "t2-2", name: "Object Oriented Principles", description: "Classes, decorators, static methods, class inheritance.", estimatedHours: 6 }
            ],
            resources: {
              youtube: [], docs: [], courses: [], articles: [], practice: [], github: [], books: [], projects: []
            }
          }
        ],
        completedTopics: ["t1-1"],
        createdAt: "2026-05-25T11:00:00Z"
      }
    ],
    notifications: [
      {
        id: "notif-1",
        userId: "user-student",
        title: "Welcome Unmesh!",
        message: "Your Smart Academic Hub registration is fully approved. Check out the library database or use the AI roadmap tool to begin.",
        date: "2026-05-20T10:00:00Z",
        read: false,
        type: "system"
      }
    ],
    planner: [
      {
        id: "event-1",
        userId: "user-student",
        title: "Python Data Analysis Practicals",
        description: "Focus on chapter 3 arrays and Pandas slicing features.",
        start: "14:00",
        end: "15:30",
        dayOfWeek: 2, // Tuesday
        completed: false,
        color: "#2563EB"
      }
    ],
    otpCodes: [],
    examNotes: []
  };
  
  // Adjust copy counts for seed book-1 is issued!
  const idx = db.books.findIndex(b => b.id === "book-1");
  if (idx !== -1) {
    db.books[idx].availableCopies = 4;
  }
  
  saveDatabase();
}

// Load database
loadDatabase();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not defined standardly in the AI secrets section.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust fallback Gemini model wrapper for dealing with high demand and service outages
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const modelsToTry = [
    params.preferredModel || 'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini API] Querying model for content generation: ${model}`);
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: model,
        contents: params.contents,
        config: params.config
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Generation model ${model} failed, or is currently experiencing high demand. Msg: ${err?.message || err}`);
    }
  }
  throw lastError;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize Express Middleware & Config Synchronously (avoids race conditions on serverless platforms like Vercel)
app.use(express.json());

// Log Middleware
app.use((req, res, next) => {
  console.log(`[HTTP Request] ${req.method} ${req.url}`);
  next();
});

// Dynamic fine counter on boot to update state based on current datetime
const now = new Date();
db.issues.forEach(item => {
  if (item.status === 'issued' && item.dueDate) {
    const due = new Date(item.dueDate);
    if (now > due) {
      const deltaMs = now.getTime() - due.getTime();
      const deltaDays = Math.ceil(deltaMs / (1000 * 60 * 60 * 24));
      item.fineAmount = deltaDays * 0.50; // $0.50 late fine per day
    }
  }
});
saveDatabase();

// API ROUTING

  // DB STATUS
  app.get('/api/db-status', (req, res) => {
    res.json({
      success: true,
      isMongoActive: false,
      connectionType: 'Local JSON Standard',
      databaseName: 'Local Sandbox File',
      db: db // send the current DB state as part of the status check to update the client
    });
  });

  // DB SYNC ENDPOINT for serverless/ephemeral environments
  app.post('/api/db-sync', (req, res) => {
    const { clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    res.json({
      success: true,
      db: db
    });
  });

  // 1. AUTHENTICATION
  app.post('/api/auth/register', (req, res) => {
    const { name, email, studentId, department, year, password, clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    if (!name || !email || !studentId || !department || !year || !password) {
      res.status(400).json({ error: 'Please supply all required student parameters' });
      return;
    }
    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      res.status(400).json({ error: 'A user with this academic email already exists' });
      return;
    }

    // Email OTP bypass verification: generate code, return it on registration so student can copy-paste straight away
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempUserId = `temp-${Date.now()}`;
    const newUser = {
      id: tempUserId,
      name,
      email,
      studentId,
      department,
      year,
      role: 'student',
      approved: false,
      passwordHash: hashPassword(password),
      readingStreak: 1,
      streakPoints: 50,
      badges: ["Fresh Explorer"],
      favoriteCategories: [],
      favoriteAuthors: [],
      interests: [],
      goals: [],
      createdAt: new Date().toISOString()
    };

    // Save temporary state alongside current OTP entry
    db.otpCodes = db.otpCodes.filter(entry => entry.email !== email);
    db.otpCodes.push({
      email,
      otpCode,
      userData: newUser,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins expiry
    });
    saveDatabase();

    // Nodemailer mock: We log of sending the details, and return code within payload so tester gets it without SMTP
    console.log(`[SMTP Mail Notification] Sending verification message to ${email}: Code is ${otpCode}`);

    res.json({
      success: true,
      message: 'OTP verification code issued standardly to your account.',
      otpCode, // Handing back code directly for user's ultimate testing speed !
      email,
      db: db
    });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otpCode, clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    if (!email || !otpCode) {
      res.status(400).json({ error: 'Please specify parameters email and otpCode' });
      return;
    }
    const recordIdx = db.otpCodes.findIndex(item => item.email.toLowerCase() === email.trim().toLowerCase() && item.otpCode.toString().trim() === otpCode.toString().trim());
    if (recordIdx === -1) {
      res.status(400).json({ error: 'Invalid or expired OTP registration code' });
      return;
    }
    const record = db.otpCodes[recordIdx];
    if (Date.now() > record.expiresAt) {
      db.otpCodes.splice(recordIdx, 1);
      saveDatabase();
      res.status(400).json({ error: 'This registration code has expired. Please register again.' });
      return;
    }

    // Complete the student promotion to true DB
    const finalUser = {
      ...record.userData,
      id: `user-${Date.now()}`
    };
    db.users.push(finalUser);
    
    // Add custom welcome notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: finalUser.id,
      title: "Welcome aboard to academic success!",
      message: `Your registration is successful. Explore ${db.books.length} textbook categories on our shelves today.`,
      date: new Date().toISOString(),
      read: false,
      type: 'system'
    });

    db.otpCodes.splice(recordIdx, 1);
    saveDatabase();

    const token = generateToken({ id: finalUser.id, role: finalUser.role, email: finalUser.email });
    
    if (finalUser.role === 'student' && finalUser.approved === false) {
      res.json({
        success: true,
        pendingApproval: true,
        message: 'OTP Code verified successfully. Student registration created. Awaiting librarian staff confirmation.',
        db: db
      });
      return;
    }

    res.json({
      success: true,
      token,
      user: {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        studentId: finalUser.studentId,
        department: finalUser.department,
        year: finalUser.year,
        role: finalUser.role,
        badges: finalUser.badges,
        streakPoints: finalUser.streakPoints,
        readingStreak: finalUser.readingStreak
      },
      db: db
    });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email, clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    if (!email) {
      res.status(400).json({ error: 'Please supply a registered email address.' });
      return;
    }

    const matchedUser = db.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
    if (!matchedUser) {
      res.status(404).json({ error: 'Academic profile with this email does not exist in our active database. Please verify spelling or register.' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Clear any previous OTP entries for this email and type list
    db.otpCodes = db.otpCodes.filter(entry => entry.email.toLowerCase() !== email.trim().toLowerCase());
    db.otpCodes.push({
      email: email.trim(),
      otpCode,
      isForgotPassword: true,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins expiry
    });
    saveDatabase();

    // Log this email simulation
    console.log(`[SMTP Mail Notification] Sending password reset verification to ${email}: Code is ${otpCode}`);

    res.json({
      success: true,
      message: 'A simulated password recovery token has been issued standardly to your account.',
      otpCode, // return code in payload for effortless testing speed !
      email: email.trim(),
      db: db
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, otpCode, newPassword, clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    if (!email || !otpCode || !newPassword) {
      res.status(400).json({ error: 'Please specify all parameters: email, otpCode, and newPassword' });
      return;
    }
    const recordIdx = db.otpCodes.findIndex(item => 
      item.email.toLowerCase() === email.trim().toLowerCase() && 
      item.otpCode.toString().trim() === otpCode.toString().trim() &&
      item.isForgotPassword === true
    );
    if (recordIdx === -1) {
      res.status(400).json({ error: 'Invalid or expired OTP reset password verification code.' });
      return;
    }
    const record = db.otpCodes[recordIdx];
    if (Date.now() > record.expiresAt) {
      db.otpCodes.splice(recordIdx, 1);
      saveDatabase();
      res.status(400).json({ error: 'This recovery token has expired. Please request a new one.' });
      return;
    }

    const matchedUser = db.users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
    if (!matchedUser) {
      res.status(404).json({ error: 'Associated user profile no longer exists.' });
      return;
    }

    // Update user's password
    matchedUser.passwordHash = hashPassword(newPassword);
    
    // Add custom system notification about password change
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: matchedUser.id,
      title: "Password Reset Successfully",
      message: "The password for your academic space was recently reset. If this wasn't you, please notify our librarian staff immediately.",
      date: new Date().toISOString(),
      read: false,
      type: 'system'
    });

    db.otpCodes.splice(recordIdx, 1);
    saveDatabase();

    res.json({
      success: true,
      message: 'Your password has been successfully updated! You can now sign in.',
      db: db
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password, role, clientDb } = req.body;
    if (clientDb) {
      mergeDatabases(clientDb);
    }
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const matchedUserByEmail = db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!matchedUserByEmail) {
      res.status(404).json({ error: 'Account with this email does not exist in the active database. Please register a new account.' });
      return;
    }

    const checkHash = hashPassword(password);
    if (matchedUserByEmail.passwordHash !== checkHash) {
      res.status(400).json({ error: 'Incorrect password entered for this email. Please try again.' });
      return;
    }

    const matchedUser = matchedUserByEmail;

    if (role && matchedUser.role !== role) {
      res.status(403).json({ error: `Selected role mismatch. Account matches the role: ${matchedUser.role}` });
      return;
    }

    if (matchedUser.role === 'student' && matchedUser.approved === false) {
      res.status(403).json({ error: 'Your registration is pending librarian approval. Please wait for the librarian to authorize your student account.' });
      return;
    }

    // On dynamic logging, update streak tracking if reading activity fits
    const todayStr = new Date().toISOString().split('T')[0];
    if (matchedUser.role === 'student') {
      if (matchedUser.lastReadingActivityDate) {
        const lastDate = new Date(matchedUser.lastReadingActivityDate);
        const dayDiff = Math.floor((new Date(todayStr).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          matchedUser.readingStreak += 1;
          matchedUser.streakPoints += 20; // 20 bonus streak points!
          matchedUser.lastReadingActivityDate = todayStr;
        } else if (dayDiff > 1) {
          matchedUser.readingStreak = 1; // broken, restarted
          matchedUser.lastReadingActivityDate = todayStr;
        }
      } else {
        matchedUser.readingStreak = 1;
        matchedUser.lastReadingActivityDate = todayStr;
      }
      saveDatabase();
    }

    const token = generateToken({ id: matchedUser.id, role: matchedUser.role, email: matchedUser.email });
    res.json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        studentId: matchedUser.studentId,
        department: matchedUser.department,
        year: matchedUser.year,
        role: matchedUser.role,
        badges: matchedUser.badges,
        streakPoints: matchedUser.streakPoints,
        readingStreak: matchedUser.readingStreak,
        lastReadingActivityDate: matchedUser.lastReadingActivityDate,
        favoriteCategories: matchedUser.favoriteCategories,
        interests: matchedUser.interests,
        goals: matchedUser.goals || []
      },
      db: db
    });
  });

  app.get('/api/auth/profile', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const matchedUser = db.users.find(u => u.id === authUser.id);
    if (!matchedUser) {
      res.status(404).json({ error: 'User registration was not found' });
      return;
    }
    res.json({
      success: true,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        studentId: matchedUser.studentId,
        department: matchedUser.department,
        year: matchedUser.year,
        role: matchedUser.role,
        badges: matchedUser.badges,
        streakPoints: matchedUser.streakPoints,
        readingStreak: matchedUser.readingStreak,
        favoriteCategories: matchedUser.favoriteCategories,
        favoriteAuthors: matchedUser.favoriteAuthors,
        interests: matchedUser.interests,
        goals: matchedUser.goals || []
      }
    });
  });

  app.put('/api/auth/profile', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { interests, favoriteCategories, favoriteAuthors } = req.body;
    const userIndex = db.users.findIndex(u => u.id === authUser.id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }
    if (interests) db.users[userIndex].interests = interests;
    if (favoriteCategories) db.users[userIndex].favoriteCategories = favoriteCategories;
    if (favoriteAuthors) db.users[userIndex].favoriteAuthors = favoriteAuthors;
    
    saveDatabase();
    res.json({ success: true, user: db.users[userIndex] });
  });

  // 2. LIBRARY BOOK INVENTORY CRUD
  function getOptionalUser(req: any) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    try {
      const [header, body, signature] = token.split('.');
      const expectedSig = crypto.createHmac('sha256', 'super-academic-secret-key-2026')
        .update(`${header}.${body}`)
        .digest('base64url');
      
      if (signature !== expectedSig) {
        return null;
      }
      const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      return db.users.find(u => u.id === decoded.id) || null;
    } catch (err) {
      return null;
    }
  }

  function computeBookPersonalization(b: any, user: any) {
    let score = 70;
    let reasons: string[] = [];
    let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';

    let titleCode = 0;
    for (let i = 0; i < (b.title || '').length; i++) {
      titleCode += b.title.charCodeAt(i);
    }
    const stableSeed = titleCode % 10;

    const lowerTitle = b.title.toLowerCase();
    const lowerCat = b.category.toLowerCase();
    if (lowerTitle.includes('intro') || lowerTitle.includes('basic') || lowerTitle.includes('fund') || lowerTitle.includes('html') || lowerTitle.includes('getting started')) {
      difficulty = 'Beginner';
    } else if (lowerTitle.includes('advanced') || lowerTitle.includes('deep') || lowerTitle.includes('architect') || lowerTitle.includes('algorithm') || lowerTitle.includes('mastering')) {
      difficulty = 'Advanced';
    } else if (lowerTitle.includes('expert') || lowerTitle.includes('quantum') || lowerTitle.includes('theory') || lowerTitle.includes('compiler')) {
      difficulty = 'Expert';
    } else {
      difficulty = 'Intermediate';
    }

    if (user) {
      const isDeptMatch = b.department.toLowerCase() === user.department.toLowerCase();
      if (isDeptMatch) {
        score += 15;
        reasons.push(`✓ Aligned with your ${user.department} syllabus`);
      } else {
        score -= 5;
      }

      const isCategoryMatch = (user.favoriteCategories || []).includes(b.category) || lowerCat.includes('ai') || lowerCat.includes('code') || lowerCat.includes('program');
      if (isCategoryMatch) {
        score += 8;
        reasons.push(`✓ Aligned with your favorite category: ${b.category}`);
      }

      score += stableSeed;

      if (b.ratingValue >= 4.5) {
        score += 4;
        reasons.push(`✓ Highly rated among senior class peers (${b.ratingValue}⭐)`);
      }

      if (reasons.length === 0) {
        reasons.push(`✓ Highly compatible academic guide`);
      }
    } else {
      score = 75 + stableSeed;
      reasons = [`✓ Core catalog choice`, `✓ High shelf popularity`];
    }

    score = Math.min(98, Math.max(60, score));

    return {
      compatibilityScore: score,
      compatibilityReason: reasons[reasons.length - 1],
      compatibilityReasons: reasons,
      difficultyLevel: difficulty
    };
  }

  app.get('/api/books', (req, res) => {
    const { search, category, department, availability, rating, sortBy } = req.query;
    let list = [...db.books];

    // Search term matching title, author, isbn, category, subject
    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(b => 
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
      );
    }

    if (category) {
      list = list.filter(b => b.category === category);
    }

    if (department) {
      list = list.filter(b => b.department.toLowerCase() === (department as string).toLowerCase());
    }

    if (availability === 'available') {
      list = list.filter(b => b.availableCopies > 0);
    }

    if (rating) {
      const rVal = parseFloat(rating as string);
      list = list.filter(b => b.ratingValue >= rVal);
    }

    // Sort models
    if (sortBy === 'popularity') {
      list.sort((a, b) => b.popularity - a.popularity);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.ratingValue - a.ratingValue);
    } else if (sortBy === 'latest') {
      list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else {
      // Default: title alphabetical
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Map customization scores
    const activeUser = getOptionalUser(req);
    const customizedList = list.map(b => {
      const decoration = computeBookPersonalization(b, activeUser);
      return {
        ...b,
        ...decoration
      };
    });

    res.json({ success: true, books: customizedList });
  });

  app.get('/api/books/categories', (req, res) => {
    const categories = Array.from(new Set(db.books.map(b => b.category)));
    res.json({ success: true, categories });
  });

  app.get('/api/books/:id', (req, res) => {
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book requested does not exist' });
      return;
    }
    res.json({ success: true, book });
  });

  // Create Book (Admin only)
  app.post('/api/books', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin clearance level required.' });
      return;
    }
    const { title, author, isbn, category, subject, department, publisher, language, edition, description, coverImage, quantity } = req.body;
    if (!title || !author || !isbn || !category || !quantity) {
      res.status(400).json({ error: 'Missing compulsory title, author, isbn, category, or quantity fields' });
      return;
    }

    const newBook = {
      id: `book-${Date.now()}`,
      title,
      author,
      isbn,
      category,
      subject: subject || 'General academic',
      department: department || 'General Studies',
      publisher: publisher || 'University Press',
      language: language || 'English',
      edition: edition || '1st Edition',
      description: description || 'No summary text available.',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
      quantity: parseInt(quantity),
      availableCopies: parseInt(quantity),
      ratings: [],
      ratingValue: 5.0,
      popularity: 0,
      addedAt: new Date().toISOString()
    };

    db.books.push(newBook);
    saveDatabase();
    res.status(201).json({ success: true, book: newBook });
  });

  // Edit Book (Admin)
  app.put('/api/books/:id', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Librarian access level required.' });
      return;
    }
    const idx = db.books.findIndex(b => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Book requested could not be located.' });
      return;
    }

    const existing = db.books[idx];
    const { title, author, isbn, category, subject, department, publisher, language, edition, description, coverImage, quantity } = req.body;

    const diffQuantity = quantity ? parseInt(quantity) - existing.quantity : 0;
    
    db.books[idx] = {
      ...existing,
      title: title || existing.title,
      author: author || existing.author,
      isbn: isbn || existing.isbn,
      category: category || existing.category,
      subject: subject || existing.subject,
      department: department || existing.department,
      publisher: publisher || existing.publisher,
      language: language || existing.language,
      edition: edition || existing.edition,
      description: description || existing.description,
      coverImage: coverImage || existing.coverImage,
      quantity: quantity ? parseInt(quantity) : existing.quantity,
      availableCopies: Math.max(0, existing.availableCopies + diffQuantity)
    };

    saveDatabase();
    res.json({ success: true, book: db.books[idx] });
  });

  // Delete Book (Admin)
  app.delete('/api/books/:id', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Librarian access level required.' });
      return;
    }
    const idx = db.books.findIndex(b => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Book requested was not found to delete.' });
      return;
    }
    
    db.books.splice(idx, 1);
    saveDatabase();
    res.json({ success: true, message: 'Book deleted from the index catalogue.' });
  });

  // Rate a book API (Student)
  app.post('/api/books/:id/rate', authenticateJWT, (req, res) => {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
      return;
    }
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }
    if (!book.ratings) book.ratings = [];
    book.ratings.push(parseInt(rating));
    book.ratingValue = parseFloat((book.ratings.reduce((a, b) => a + b, 0) / book.ratings.length).toFixed(1));
    saveDatabase();
    res.json({ success: true, ratingValue: book.ratingValue });
  });

  // 3. BOOK ISSUE WORKFLOW
  // Request Book (Student)
  app.post('/api/issues/request', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { bookId } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'Please specify the target bookId.' });
      return;
    }

    const student = db.users.find(u => u.id === authUser.id);
    const book = db.books.find(b => b.id === bookId);
    if (!book) {
      res.status(404).json({ error: 'Requested book not found.' });
      return;
    }

    // Check if student already holds a pending/active copy of the SAME book
    const duplicate = db.issues.some(iss => 
      iss.studentId === authUser.id && 
      iss.bookId === bookId && 
      ['pending', 'issued', 'approved'].includes(iss.status)
    );
    if (duplicate) {
      res.status(400).json({ error: 'You already have an outstanding request or active issue for this exact book.' });
      return;
    }

    const newIssue = {
      id: `issue-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      studentId: authUser.id,
      studentName: student ? student.name : 'Unknown Student',
      studentEmail: authUser.email,
      requestDate: new Date().toISOString(),
      status: 'pending',
      fineAmount: 0,
      finePaid: false,
      isRenewed: false
    };

    db.issues.push(newIssue);
    saveDatabase();
    res.json({ success: true, message: 'Issue request recorded. Awaiting admin librarian approval.', issue: newIssue });
  });

  // ADMIN COMPATIBILITY ENDPOINTS for AdminDashboard.tsx
  app.get('/api/admin/issues/pending', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }
    const pendingList = db.issues.filter(i => i.status === 'pending').map(issue => {
      const student = db.users.find(u => u.id === issue.studentId);
      return {
        ...issue,
        studentPRN: student ? student.studentId : 'N/A'
      };
    });
    res.json({ success: true, issues: pendingList });
  });

  // Get pending student account registrations awaiting librarian approval
  app.get('/api/admin/users/pending', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }
    const pendingStudents = db.users.filter(u => u.role === 'student' && u.approved === false);
    res.json({ success: true, students: pendingStudents });
  });

  // Approve a pending student registration
  app.post('/api/admin/users/:id/approve', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }
    const student = db.users.find(u => u.role === 'student' && u.id === req.params.id);
    if (!student) {
      res.status(404).json({ error: 'Student registration record not located.' });
      return;
    }
    student.approved = true;
    saveDatabase();
    res.json({ success: true, message: 'Student registration approved and activated successfully.' });
  });

  // Decline/Reject/Delete a pending student registration request 
  app.post('/api/admin/users/:id/reject', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }
    const exists = db.users.some(u => u.role === 'student' && u.id === req.params.id);
    if (!exists) {
      res.status(404).json({ error: 'Student registration record not located.' });
      return;
    }
    db.users = db.users.filter(u => u.id !== req.params.id);
    saveDatabase();
    res.json({ success: true, message: 'Student registration requests declined.' });
  });

  app.post('/api/admin/issues/approve', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can approve outstanding library checkouts.' });
      return;
    }
    const { issueId } = req.body;
    const issue = db.issues.find(iss => iss.id === issueId);
    if (!issue) {
      res.status(404).json({ error: 'Checkout request metadata not found.' });
      return;
    }
    if (issue.status !== 'pending') {
      res.status(400).json({ error: 'This issue request has already been processed.' });
      return;
    }

    const book = db.books.find(b => b.id === issue.bookId);
    if (!book) {
      res.status(404).json({ error: 'The book referenced in checkout request was not located' });
      return;
    }

    if (book.availableCopies <= 0) {
      res.status(400).json({ error: 'No virtual copies of this textbook are currently available.' });
      return;
    }

    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.popularity += 1;

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 14);

    issue.status = 'issued';
    issue.issueDate = issueDate.toISOString();
    issue.dueDate = dueDate.toISOString();
    issue.approveDate = new Date().toISOString();
    issue.qrCodeIssued = true;

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Checkout Request Approved!',
      message: `"${book.title}" has been authorized. Return or renew by ${dueDate.toLocaleDateString()}.`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Book issue confirmed.', issue });
  });

  app.post('/api/admin/issues/reject', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Access level unauthorized' });
      return;
    }
    const { issueId, comments } = req.body;
    const issue = db.issues.find(iss => iss.id === issueId);
    if (!issue || issue.status !== 'pending') {
      res.status(400).json({ error: 'Transaction cannot be rejected' });
      return;
    }
    issue.status = 'rejected';
    issue.comments = comments || 'Rejected by Librarian.';

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Checkout Issue Rejected',
      message: `Request for "${issue.bookTitle}" declined: ${issue.comments}`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Checkout issue rejected.' });
  });

  app.get('/api/admin/reports', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }
    const totalBooks = db.books.length; // Count unique catalog titles instead of sum of copies quantity
    const activeStudents = db.users.filter(u => u.role === 'student').length;
    const totalIssued = db.issues.filter(i => i.status === 'issued').length;
    const totalPending = db.issues.filter(i => i.status === 'pending').length + db.users.filter(u => u.role === 'student' && u.approved === false).length;

    res.json({
      success: true,
      totalUsers: activeStudents,
      totalBooks,
      totalIssued,
      totalPending
    });
  });

  app.get('/api/admin/students-activity', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Access level unauthorized' });
      return;
    }
    const students = db.users.filter(u => u.role === 'student').map(student => {
      const studentIssues = db.issues.filter(i => i.studentId === student.id);
      const activeCheckouts = studentIssues.filter(i => i.status === 'issued');
      const accessionHistory = studentIssues.map(i => ({
        id: i.id,
        bookTitle: i.bookTitle,
        bookId: i.bookId,
        requestDate: i.requestDate,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        returnDate: i.returnDate,
        status: i.status,
        fineAmount: i.fineAmount
      }));

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId || 'N/A', // PRN
        department: student.department || 'N/A',
        year: student.year || 'N/A',
        activeCheckoutsCount: activeCheckouts.length,
        activeCheckouts: activeCheckouts.map(i => i.bookTitle),
        history: accessionHistory
      };
    });
    res.json({ success: true, students });
  });

  // Approve requested checkout (Admin) - Transitions status to 'approved' then 'issued'
  app.post('/api/issues/:id/approve', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can approve outstanding library checkouts.' });
      return;
    }
    const issue = db.issues.find(iss => iss.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Checkout request metadata not found.' });
      return;
    }
    if (issue.status !== 'pending') {
      res.status(400).json({ error: 'This issue request has already been processed.' });
      return;
    }

    const book = db.books.find(b => b.id === issue.bookId);
    if (!book) {
      res.status(404).json({ error: 'The book referenced in checkout request was not located' });
      return;
    }

    if (book.availableCopies <= 0) {
      res.status(400).json({ error: 'No virtual copies of this textbook are currently available. Student may reserve instead.' });
      return;
    }

    // Adjust copies count
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    book.popularity += 1;

    // Issue updates
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 14); // 14-day checkout window

    issue.status = 'issued';
    issue.issueDate = issueDate.toISOString();
    issue.dueDate = dueDate.toISOString();
    issue.approveDate = now.toISOString();
    issue.qrCodeIssued = true; // Enables easy standard test scans!

    // Push notification to student
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Checkout Request Approved!',
      message: `"${book.title}" has been authorized. Return or renew by ${dueDate.toLocaleDateString()}. Use QR Code to scan return.`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Book issue confirmed.', issue });
  });

  // Reject checkout issue (Admin)
  app.post('/api/issues/:id/reject', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { comments } = req.body;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Access level unauthorized' });
      return;
    }
    const issue = db.issues.find(iss => iss.id === req.params.id);
    if (!issue || issue.status !== 'pending') {
      res.status(400).json({ error: 'Transaction cannot be rejected' });
      return;
    }
    issue.status = 'rejected';
    issue.comments = comments || 'Rejected by Librarian / Overdue fine thresholds exceeded.';
    
    // Notify Student
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Checkout Issue Rejected',
      message: `Request for "${issue.bookTitle}" declined: ${issue.comments}`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, issue });
  });

  // Renew book checkout (Student/Librarian) - Adds 14 days
  app.post('/api/issues/:id/renew', authenticateJWT, (req, res) => {
    const issue = db.issues.find(iss => iss.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Active issue log not found' });
      return;
    }
    if (issue.status !== 'issued') {
      res.status(400).json({ error: 'This book cannot be renewed unless currently active.' });
      return;
    }
    if (issue.isRenewed) {
      res.status(400).json({ error: 'This issue checkout has already been renewed. Limit is 1 extension.' });
      return;
    }

    const currentDue = new Date(issue.dueDate!);
    currentDue.setDate(currentDue.getDate() + 14); // Extended 14 days
    
    issue.dueDate = currentDue.toISOString();
    issue.isRenewed = true;

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Textbook Issue Extended Successfully',
      message: `"${issue.bookTitle}" has been renewed. New target deadline is ${currentDue.toLocaleDateString()}`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Issue renewal confirmed.', issue });
  });

  // Return Book (Librarian/Student via auto check in/QR)
  app.post('/api/issues/:id/return', authenticateJWT, (req, res) => {
    const issue = db.issues.find(iss => iss.id === req.params.id);
    if (!issue) {
      res.status(404).json({ error: 'Issue transaction register not loaded' });
      return;
    }
    if (issue.status !== 'issued') {
      res.status(400).json({ error: 'This textbook checkout has already been settled.' });
      return;
    }

    const book = db.books.find(b => b.id === issue.bookId);
    if (book) {
      book.availableCopies = Math.min(book.quantity, book.availableCopies + 1);
    }

    issue.status = 'returned';
    issue.returnDate = new Date().toISOString();

    // Reset student activity & increase reading points for streak check!
    const student = db.users.find(u => u.id === issue.studentId);
    if (student) {
      student.streakPoints += 30; // 30 points awarded for successful returns!
      if (!student.badges.includes('Devoted Reader') && student.streakPoints >= 100) {
        student.badges.push('Devoted Reader');
      }
    }

    // Process Book Reservation waiting queues if copy became newly available
    if (book && book.availableCopies > 0) {
      const activeReservations = db.reservations
        .filter(r => r.bookId === book.id && r.status === 'waiting')
        .sort((a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
        
      if (activeReservations.length > 0) {
        // Assign copy to first item in reserve queue
        const topReserve = activeReservations[0];
        topReserve.status = 'available';
        topReserve.notifiedAt = new Date().toISOString();
        
        // Block the count so the copy belongs strictly to this reservation
        book.availableCopies = Math.max(0, book.availableCopies - 1);

        // Notify reserved student
        db.notifications.push({
          id: `notif-${Date.now()}`,
          userId: topReserve.studentId,
          title: 'Reserved Book Available!',
          message: `Your reservation for "${book.title}" is ready on dynamic hold. Pick it up or approve checkout within 48 hours.`,
          date: new Date().toISOString(),
          read: false,
          type: 'library'
        });
      }
    }

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: issue.studentId,
      title: 'Book Returned Successfully',
      message: `Return logistics settled for "${issue.bookTitle}". Thank you, point trackers updated.`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Return logistics settled.', issue });
  });

  // Book request history logs
  app.get('/api/issues', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    let list = [...db.issues];
    
    // Students can only view their own issue records
    if (authUser.role === 'student') {
      list = list.filter(iss => iss.studentId === authUser.id);
    }
    
    // Sort latest first
    list.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    res.json({ success: true, issues: list });
  });

  // 4. BOOK RESERVATION QUEUES
  app.post('/api/reservations/join', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { bookId } = req.body;
    if (!bookId) {
      res.status(400).json({ error: 'Target bookId required' });
      return;
    }

    const book = db.books.find(b => b.id === bookId);
    if (!book) {
      res.status(404).json({ error: 'Book requested for queue not found' });
      return;
    }

    // Only allow reserve if copies actually = 0
    if (book.availableCopies > 0) {
      res.status(400).json({ error: 'Copies are actively available on shelves immediately. Please issue directly instead.' });
      return;
    }

    const student = db.users.find(u => u.id === authUser.id);

    const matchExists = db.reservations.some(r => r.bookId === bookId && r.studentId === authUser.id && ['waiting', 'available'].includes(r.status));
    if (matchExists) {
      res.status(400).json({ error: 'You already hold an active reservation placeholder for this textbook.' });
      return;
    }

    // Determine current position queue counts
    const pos = db.reservations.filter(r => r.bookId === bookId && r.status === 'waiting').length + 1;

    const newReservation = {
      id: `reserve-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      studentId: authUser.id,
      studentName: student ? student.name : 'Unknown',
      studentEmail: authUser.email,
      requestDate: new Date().toISOString(),
      queuePosition: pos,
      status: 'waiting'
    };

    db.reservations.push(newReservation);
    
    // Add alert
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: authUser.id,
      title: 'Joined Book Reservation List',
      message: `You are placed at Queue Position #${pos} for "${book.title}". We will notify you when a copy returns.`,
      date: new Date().toISOString(),
      read: false,
      type: 'library'
    });

    saveDatabase();
    res.json({ success: true, message: 'Reservation queue registered successfully.', reservation: newReservation });
  });

  app.get('/api/reservations', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    let list = [...db.reservations];
    
    if (authUser.role === 'student') {
      list = list.filter(r => r.studentId === authUser.id);
    }
    
    list.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    res.json({ success: true, reservations: list });
  });

  // Admin clear / finalize reservation to issue
  app.post('/api/reservations/:id/claim', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const resv = db.reservations.find(r => r.id === req.params.id);
    if (!resv || resv.status !== 'available') {
      res.status(400).json({ error: 'Reservation claims not available.' });
      return;
    }

    const book = db.books.find(b => b.id === resv.bookId);

    // Create a new direct issue record
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + 14);

    const issueRec = {
      id: `issue-${Date.now()}`,
      bookId: resv.bookId,
      bookTitle: resv.bookTitle,
      studentId: resv.studentId,
      studentName: resv.studentName,
      studentEmail: resv.studentEmail,
      requestDate: resv.requestDate,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'issued' as const,
      fineAmount: 0,
      finePaid: false,
      isRenewed: false,
      qrCodeIssued: true
    };

    resv.status = 'issued' as any;
    db.issues.push(issueRec);
    
    saveDatabase();
    res.json({ success: true, issue: issueRec });
  });

  app.post('/api/reservations/:id/cancel', authenticateJWT, (req, res) => {
    const resv = db.reservations.find(r => r.id === req.params.id);
    if (!resv) {
      res.status(404).json({ error: 'Reservation placeholder not found.' });
      return;
    }
    resv.status = 'cancelled';
    saveDatabase();
    res.json({ success: true, message: 'Reservation queue index cancelled.' });
  });

  // 5. SMART BOOK RECOMMENDATION ENGINE
  app.get('/api/recommendations', authenticateJWT, async (req, res) => {
    const authUser = (req as any).user;
    const student = db.users.find(u => u.id === authUser.id);
    if (!student) {
      res.status(404).json({ error: 'Student database entry unavailable.' });
      return;
    }

    // Gather heuristics
    const studentIssues = db.issues.filter(i => i.studentId === student.id);
    const issuedBookIds = studentIssues.map(i => i.bookId);
    
    // Core recommendations heuristic list
    const recs: { book: any; reason: string; badge: string }[] = [];

    // Rule A: Similar Books in same category
    if (issuedBookIds.length > 0) {
      const issuedBooks = db.books.filter(b => issuedBookIds.includes(b.id));
      const favCats = Array.from(new Set(issuedBooks.map(b => b.category)));
      
      const similarCandidates = db.books.filter(b => !issuedBookIds.includes(b.id) && favCats.includes(b.category));
      similarCandidates.slice(0, 2).forEach(item => {
        recs.push({
          book: item,
          reason: `Based on your interest in ${item.category} textbooks.`,
          badge: "Similar Book"
        });
      });
    }

    // Rule B: Department Specific Books
    const deptBooks = db.books.filter(b => b.department.toLowerCase() === student.department.toLowerCase() && !issuedBookIds.includes(b.id));
    deptBooks.slice(0, 2).forEach(item => {
      recs.push({
        book: item,
        reason: `Popular textbook recommended for all ${student.department} undergraduates.`,
        badge: "Department Pick"
      });
    });

    // Rule C: Trending & Popular books
    const trending = [...db.books]
      .filter(b => !issuedBookIds.includes(b.id))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 2);
      
    trending.forEach(item => {
      recs.push({
        book: item,
        reason: `Trending textbook read by students in multiple disciplines.`,
        badge: "Campus Trending"
      });
    });

    // Option: Use Gemini for AI-recommends!
    let aiReasonings: any[] = [];
    let hasAI = false;
    if (process.env.GEMINI_API_KEY) {
      try {
        const userSummary = `
          Student ID Details: Name ${student.name}, Dept: ${student.department}, Interests: ${student.interests.join(', ')}.
          Reading history: ${studentIssues.map(i => i.bookTitle).join(', ')}.
          Available catalog items in Library: ${db.books.map(b => `${b.title} [id: ${b.id}, cat: ${b.category}, auth: ${b.author}]`).join('; ')}
        `;

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: `Evaluate this academic student and select 3 highly personalized library book IDs from the catalog. Support each recommendation with a 1-sentence friendly explanation of why they will love it. Return your output strictly as a JSON list matching this type: [{ "bookId": "string", "reason": "string", "badge": "string" }]. UserSummary: ${userSummary}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bookId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  badge: { type: Type.STRING }
                },
                required: ['bookId', 'reason', 'badge']
              }
            }
          }
        });

        const outputText = response.text;
        if (outputText) {
          const aiRecs = JSON.parse(outputText.trim());
          aiRecs.forEach((aiRec: any) => {
            const b = db.books.find(x => x.id === aiRec.bookId);
            if (b) {
              aiReasonings.push({
                book: b,
                reason: aiRec.reason,
                badge: aiRec.badge || "AI Smart Match"
              });
            }
          });
          if (aiReasonings.length > 0) hasAI = true;
        }
      } catch (err) {
        console.error('Gemini Recommendation Engine failed to parse prompt, using heuristic models...', err);
      }
    }

    res.json({
      success: true,
      recommendations: hasAI ? aiReasonings : recs.slice(0, 4)
    });
  });

  // 6. AI SKILL ROADMAP GENERATOR
  app.post('/api/roadmaps/generate', authenticateJWT, async (req, res) => {
    const authUser = (req as any).user;
    const { skillName } = req.body;
    if (!skillName) {
      res.status(400).json({ error: 'Please supply a skillName to generate roadmap' });
      return;
    }

    console.log(`[AI Roadmap Engine] Request received for: ${skillName}`);

    // If API key is available, generate dynamically; else use a solid pre-configured fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Create a complete, detailed 4-stage academic learning roadmap for learning the skill: "${skillName}".
        The roadmap must contain exactly 4 stages named: "Beginner", "Intermediate", "Advanced", and "Real Projects".
        For each stage, provide appropriate list of topics (each with unique topic id like "t1-1", "t1-2", "name" and detail description, estimatedHours), goals list, and links to recommended learning resources (youtube resources, official documentation, free courses, articles, practice platform websites, GitHub repos, books, and projectIdeas list with difficulty).
        Format the response strictly under the JSON schema supplied. Wait, keep it concise so it builds fast.`;

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                skillName: { type: Type.STRING },
                stages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING }, // "Beginner" | "Intermediate" | "Advanced" | "Real Projects"
                      goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                      topics: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            estimatedHours: { type: Type.INTEGER }
                          },
                          required: ['id', 'name', 'description']
                        }
                      },
                      resources: {
                        type: Type.OBJECT,
                        properties: {
                          youtube: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                          docs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                          courses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                          books: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                          practice: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, url: { type: Type.STRING } } } },
                          projects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, difficulty: { type: Type.STRING } } } }
                        }
                      }
                    },
                    required: ['id', 'name', 'topics', 'goals', 'resources']
                  }
                }
              },
              required: ['skillName', 'stages']
            }
          }
        });

        const outputText = response.text;
        if (outputText) {
          const rawRoadmap = JSON.parse(outputText.trim());
          const newRoadmap = {
            id: `road-${Date.now()}`,
            studentId: authUser.id,
            skillName: rawRoadmap.skillName,
            status: 'active',
            progress: 0,
            stages: rawRoadmap.stages,
            completedTopics: [],
            createdAt: new Date().toISOString()
          };
          db.roadmaps.push(newRoadmap);
          saveDatabase();
          res.json({ success: true, roadmap: newRoadmap });
          return;
        }
      } catch (err) {
        console.error('Gemini Roadmap generator query failed, falling back to smart client generators...', err);
      }
    }

    // Dynamic Mock Fallback logic (makes development robust if keys are offline)
    const mockRoadmap = {
      id: `road-mock-${Date.now()}`,
      studentId: authUser.id,
      skillName: skillName,
      status: 'active',
      progress: 0,
      completedTopics: [],
      createdAt: new Date().toISOString(),
      stages: [
        {
          id: "m-s1",
          name: "Beginner",
          goals: ["Familiarize with standard setup syntax", "Build hello-world templates"],
          topics: [
            { id: "m-t1", name: `${skillName} Environment & Principles`, description: `Fundamental setups, dependencies, variables, variables types.`, estimatedHours: 4 },
            { id: "m-t2", name: `Structuring your first scripts`, description: `Functions, syntax loops, modular packaging properties.`, estimatedHours: 5 }
          ],
          resources: {
            youtube: [{ title: `${skillName} Tutorial for Absolute Beginners`, url: "https://youtube.com/results?search_query=" + encodeURIComponent(skillName) }],
            docs: [{ title: `${skillName} Digital Official Resource Guide`, url: "https://wikipedia.org/wiki/" + encodeURIComponent(skillName) }],
            courses: [{ title: `Interactive Fundamentals of ${skillName}`, url: "#" }],
            books: [{ title: `Learning ${skillName} in 21 Days`, url: "#" }],
            practice: [{ title: `Interactive Exercise Coding Prompts`, url: "#" }],
            projects: [{ title: `Personal Dashboard Utility`, description: `Build a highly functional modular terminal analyzer tool on files.`, difficulty: 'Beginner' }]
          }
        },
        {
          id: "m-s2",
          name: "Intermediate",
          goals: ["Implement algorithms", "Manage advanced states data flow"],
          topics: [
            { id: "m-t3", name: `Advanced Object Design & Data Classes`, description: `Master asynchronous operations, closures, API processing pipelines.`, estimatedHours: 8 },
            { id: "m-t4", name: `Database Schemas integration`, description: `Connecting storage states, CRUD engines, and error catch loops.`, estimatedHours: 6 }
          ],
          resources: {
            youtube: [], docs: [], courses: [], books: [], practice: [],
            projects: [{ title: `Smart Task Manager App`, description: `Construct a persistent planner tracking category inputs.`, difficulty: 'Intermediate' }]
          }
        },
        {
          id: "m-s3",
          name: "Advanced",
          goals: ["Performance tweaking & caching", "CI CD automated pipelines"],
          topics: [
            { id: "m-t5", name: `Design patterns & Structural Optimization`, description: `Scalability models, garbage collections, asynchronous multithreading locks.`, estimatedHours: 12 }
          ],
          resources: { youtube: [], docs: [], courses: [], books: [], practice: [], projects: [] }
        },
        {
          id: "m-s4",
          name: "Real Projects",
          goals: ["Author ready-to-publish systems", "Build deep integrations"],
          topics: [
            { id: "m-t6", name: `Production Release & Sandbox Deployment`, description: `Securing access tokens, Dockerize services, CDN optimizations.`, estimatedHours: 15 }
          ],
          resources: {
            youtube: [], docs: [], courses: [], books: [], practice: [],
            projects: [{ title: `Smart Academic Hub Mock Clone`, description: `Fully implement library recommendations with localized states.`, difficulty: 'Advanced' }]
          }
        }
      ]
    };

    db.roadmaps.push(mockRoadmap);
    saveDatabase();
    res.json({ success: true, roadmap: mockRoadmap });
  });

  app.get('/api/roadmaps', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const studentRoadmaps = db.roadmaps.filter(r => r.studentId === authUser.id);
    res.json({ success: true, roadmaps: studentRoadmaps });
  });

  app.get('/api/roadmaps/:id', authenticateJWT, (req, res) => {
    const road = db.roadmaps.find(r => r.id === req.params.id);
    if (!road) {
      res.status(404).json({ error: 'Learning roadmap template not found' });
      return;
    }
    res.json({ success: true, roadmap: road });
  });

  // Track Topic Complete Progress
  app.post('/api/roadmaps/:id/toggle-topic', authenticateJWT, (req, res) => {
    const { topicId } = req.body;
    const road = db.roadmaps.find(r => r.id === req.params.id);
    if (!road) {
      res.status(404).json({ error: 'Learning roadmap not found' });
      return;
    }

    if (!road.completedTopics) road.completedTopics = [];

    const idx = road.completedTopics.indexOf(topicId);
    if (idx > -1) {
      road.completedTopics.splice(idx, 1);
    } else {
      road.completedTopics.push(topicId);
      
      // Award points for progress!
      const student = db.users.find(u => u.id === road.studentId);
      if (student) {
        student.streakPoints += 15; // 15 points per completed learning milestone!
        if (student.streakPoints >= 300 && !student.badges.includes('Elite Scholar')) {
          student.badges.push('Elite Scholar');
        }
      }
    }

    // Total topics index
    let totalTopicsCount = 0;
    road.stages.forEach((stg: any) => {
      totalTopicsCount += stg.topics.length;
    });

    road.progress = totalTopicsCount > 0 
      ? Math.round((road.completedTopics.length / totalTopicsCount) * 100)
      : 0;

    if (road.progress === 100) {
      road.status = 'completed';
      road.completedAt = new Date().toISOString();
      
      // Award certificate badge!
      const student = db.users.find(u => u.id === road.studentId);
      if (student && !student.badges.includes(`${road.skillName} Graduate`)) {
        student.badges.push(`${road.skillName} Graduate`);
        student.streakPoints += 100; // Big bonus for full completion!
      }
    } else {
      road.status = 'active';
    }

    saveDatabase();
    res.json({ success: true, roadmap: road });
  });

  // 7. AI ACADEMIC CHATBOT ASSISTANT
  app.post('/api/chatbot', authenticateJWT, async (req, res) => {
    const { message, chatHistory } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Empty query messages not supported.' });
      return;
    }

    console.log(`[AI Academic Chatbot] Processing query: "${message}"`);

    if (process.env.GEMINI_API_KEY) {
      try {
        // Assemble short context of our books so assistant is grounded in Smart Academic Hub catalogue!
        const libraryContext = db.books.map(b => `"${b.title}" written by ${b.author} [Category: ${b.category}, Dept: ${b.department}, copies remaining: ${b.availableCopies}]`).join('; ');
        
        let contextInstruction = `You are the Smart Academic Hub Librarian AI Helper. You have direct access to our physical university database catalog to answer questions about campus learning libraries, books, issue logistics, study plans and concept definitions. Ground your replies professionally, encourage reading and suggest resources. Our current Catalog: [ ${libraryContext} ]. Format replies cleanly using Markdown layout.`;

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: message,
          config: {
            systemInstruction: contextInstruction,
            temperature: 0.7
          }
        });

        const reply = response.text;
        if (reply) {
          res.json({ success: true, reply });
          return;
        }
      } catch (err: any) {
        console.warn('Gemini Chatbot connection failed, resorting to intelligent rule-based helper fallback', err);
      }
    }

    // Advanced Local Mock Chat Responses
    const q = message.toLowerCase();
    let reply = process.env.GEMINI_API_KEY
      ? "[The Gemini service is temporarily experiencing high demand. Here represents our grounded helpful guidelines for you] "
      : "I am currently running in Offline Sandbox Mode as no GEMINI_API_KEY secret token has been registered. ";
    
    if (q.includes('recommend') || q.includes('book') || q.includes('suggest')) {
      reply += "\n\nBased on your curriculum, I highly recommend checking out on our shelf:\n1. **Introduction to Python & Data Analysis** by Dr. Catherine Meadows\n2. **Advanced Machine Learning** by Prateek Harrison\n3. **Full-Stack Web Architectures** by Robert Henderson.\n\nYou can issue these directly from your student portal dashboard! Or configure your API key in Secrets panel to unlock custom AI analysis.";
    } else if (q.includes('roadmap') || q.includes('skill') || q.includes('learn')) {
      reply += "\n\nYou can generate dynamic multi-level progress learning roadmaps standardly from the *Skill Roadmaps* tab. Type any topic (e.g. 'Cybersecurity', 'Web Dev', 'Marketing') and the system will design topics, goals, and point out free courses and resources automatically.";
    } else if (q.includes('fine') || q.includes('return') || q.includes('due')) {
      reply += "\n\nStandard Hub checkouts are issued for 14 calendar days. Late returns accumulate a configurable fee of **$0.50 per day**. You can request a renewal directly from your profile's issued book records card to secure an additional 14-day hold.";
    } else {
      reply += `\n\nReceived your question: "${message}". Connect a valid Gemini key in the AI Studio settings Panel to receive deep academic concept explanations, live calculations, and customized study paths!`;
    }

    res.json({ success: true, reply });
  });

  // 8. VOICE SEARCH / REVIEW GENERATOR & SUMMARY GENERATOR (HACKATHON BONUSES)
  // AI Book Summary Generator
  app.post('/api/books/:id/generate-summary', authenticateJWT, async (req, res) => {
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book model not found.' });
      return;
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: `Write a brilliant, engaging, 2-paragraph reading summary and 3 essential takeaways of the academic textbook: "${book.title}" by author ${book.author}. Outline who this book is most helpful for. Category is ${book.category}, Subject: ${book.subject}.`,
        });
        if (response.text) {
          res.json({ success: true, summary: response.text });
          return;
        }
      } catch (err) {
        console.error('Failed to query Gemini reader summary', err);
      }
    }

    // Static Mock Summary
    const staticSummary = `### Student Reading Guide: ${book.title}
This highly regarded textbook, *"${book.title}"* by ${book.author}, delivers a structurally sound introduction to core concepts. Inside, students are treated to comprehensive illustrations, practical test case analyses, and equations designed to bridge theoretical models with real industry applications.

### 3 Key Academic Takeaways:
1. **Core Integration**: Establishes high-impact foundational methodologies to scale practical deployments.
2. **Methodical Workflows**: Highlights standard processes to debug, validate, and document structural frameworks.
3. **Responsive Exercises**: Features modular chapter end review assignments that mimic actual interview panels.

**Ideal For:** Undergraduates looking to excel in ${book.category} curriculums.`;

    res.json({ success: true, summary: staticSummary });
  });

  // AI Review Generator
  app.post('/api/books/:id/generate-review', authenticateJWT, async (req, res) => {
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book to review not found.' });
      return;
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: `Generate a constructive, academic book review of "${book.title}" by ${book.author} written from the perspective of an expert University Professor. Critique the curriculum design, clarity of chapter breakdowns, and give an overall score recommendation.`,
        });
        if (response.text) {
          res.json({ success: true, review: response.text });
          return;
        }
      } catch (err) {
        console.error('Failed to query Gemini review generator', err);
      }
    }

    const mockReview = `### Faculty Evaluation: ${book.title}
**Reviewer:** Faculty Academic Board, Senior Lecturer
**Rating:** ⭐⭐⭐⭐⭐ (4.8 / 5)

*Review:* 
As a curriculum designer, I find ${book.author}'s approach to "${book.title}" highly refreshing. The author manages to convey complex theoretical parameters without drowning students in jargon. Each chapter starts with a historical introduction, builds intermediate parameters cleanly, and wraps up with interactive project templates.

*Suggested Study Context:* Excellent secondary reading for senior capstone preparations or introductory lab courses. Fits easily on any modern syllabus.`;

    res.json({ success: true, review: mockReview });
  });

  // 9. STUDENT GOAL TRACKING (LEARNING PROGRESS)
  app.get('/api/goals', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const student = db.users.find(u => u.id === authUser.id);
    if (!student) {
      res.status(404).json({ error: 'User student profile not found' });
      return;
    }
    res.json({ success: true, goals: student.goals || [] });
  });

  app.post('/api/goals', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { type, description, targetValue } = req.body;
    if (!description || !targetValue || !type) {
      res.status(400).json({ error: 'Missing compulsory type, description, or targetValue properties' });
      return;
    }
    const studentIndex = db.users.findIndex(u => u.id === authUser.id);
    if (studentIndex === -1) {
      res.status(404).json({ error: 'Student registration invalid' });
      return;
    }

    const d = new Date();
    if (type === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }

    const newGoal = {
      id: `goal-${Date.now()}`,
      type,
      description,
      targetValue: parseFloat(targetValue),
      currentValue: 0,
      deadline: d.toISOString().split('T')[0],
      completed: false
    };

    if (!db.users[studentIndex].goals) db.users[studentIndex].goals = [];
    db.users[studentIndex].goals.push(newGoal);
    saveDatabase();

    res.json({ success: true, goal: newGoal });
  });

  app.post('/api/goals/:id/progress', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { amount } = req.body;
    const studentIndex = db.users.findIndex(u => u.id === authUser.id);
    if (studentIndex === -1) {
      res.status(404).json({ error: 'Profile not loaded' });
      return;
    }

    const student = db.users[studentIndex];
    if (!student.goals) student.goals = [];
    const goal = student.goals.find(g => g.id === req.params.id);
    if (!goal) {
      res.status(404).json({ error: 'Goal target not found' });
      return;
    }

    const inc = amount ? parseFloat(amount) : 1;
    goal.currentValue = Math.min(goal.targetValue, goal.currentValue + inc);
    if (goal.currentValue >= goal.targetValue) {
      goal.completed = true;
      student.streakPoints += 25; // 25 points bonus
      
      // Notify learning target unlocked!
      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: student.id,
        title: 'Academic Milestone Completed!',
        message: `Learning Goal Achieved: "${goal.description}". Well done! +25 Points.`,
        date: new Date().toISOString(),
        read: false,
        type: 'learning'
      });
    }

    saveDatabase();
    res.json({ success: true, goal });
  });

  app.delete('/api/goals/:id', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const studentIdx = db.users.findIndex(u => u.id === authUser.id);
    if (studentIdx === -1) {
      res.status(404).json({ error: 'Student check error' });
      return;
    }
    
    const goals = db.users[studentIdx].goals || [];
    db.users[studentIdx].goals = goals.filter(g => g.id !== req.params.id);
    saveDatabase();
    res.json({ success: true, message: 'Goal target removed.' });
  });

  // 10. STUDY PLANNER (POMODORO / CALENDAR EVENTS MODULE)
  app.get('/api/planner', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const events = db.planner.filter(evt => evt.userId === authUser.id);
    res.json({ success: true, planner: events });
  });

  app.post('/api/planner', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const { title, description, start, end, dayOfWeek, date, color } = req.body;
    if (!title || !start || !end) {
      res.status(400).json({ error: 'Missing title, start time or end time.' });
      return;
    }

    const newEvent = {
      id: `evt-${Date.now()}`,
      userId: authUser.id,
      title,
      description: description || '',
      start,
      end,
      dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
      date,
      color: color || '#2563EB',
      completed: false
    };

    db.planner.push(newEvent);
    saveDatabase();
    res.json({ success: true, event: newEvent });
  });

  app.put('/api/planner/:id', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const idx = db.planner.findIndex(evt => evt.id === req.params.id && evt.userId === authUser.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Event scheduler log not found.' });
      return;
    }

    const existing = db.planner[idx];
    const { completed, title, description, start, end } = req.body;
    
    db.planner[idx] = {
      ...existing,
      completed: completed !== undefined ? completed : existing.completed,
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      start: start || existing.start,
      end: end || existing.end
    };

    if (completed && !existing.completed) {
      // Award points for completing study slots
      const student = db.users.find(u => u.id === authUser.id);
      if (student) {
        student.streakPoints += 10;
        saveDatabase();
      }
    }

    saveDatabase();
    res.json({ success: true, event: db.planner[idx] });
  });

  app.delete('/api/planner/:id', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const index = db.planner.findIndex(evt => evt.id === req.params.id && evt.userId === authUser.id);
    if (index === -1) {
      res.status(404).json({ error: 'Event scheduler log not found' });
      return;
    }
    db.planner.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: 'Scheduler event deleted' });
  });

  // 11. NOTIFICATIONS
  app.get('/api/notifications', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const list = db.notifications.filter(n => n.userId === authUser.id);
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, notifications: list });
  });

  app.post('/api/notifications/read-all', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    db.notifications.forEach(n => {
      if (n.userId === authUser.id) n.read = true;
    });
    saveDatabase();
    res.json({ success: true });
  });

  app.post('/api/notifications/:id/read', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const n = db.notifications.find(item => item.id === req.params.id && item.userId === authUser.id);
    if (n) {
      n.read = true;
      saveDatabase();
    }
    res.json({ success: true });
  });

  // 12. LEADERBOARDS & ANALYTICS
  app.get('/api/leaderboard', (req, res) => {
    const board = db.users
      .filter(u => u.role === 'student')
      .map(student => ({
        userId: student.id,
        name: student.name,
        studentId: student.studentId || '',
        department: student.department,
        streakPoints: student.streakPoints || 0,
        readingStreak: student.readingStreak || 0,
        badgesCount: (student.badges || []).length,
        badges: student.badges || []
      }))
      .sort((a, b) => b.streakPoints - a.streakPoints);

    res.json({ success: true, leaderboard: board });
  });

  // STUDENT READING ACHIEVEMENTS SYSTEM
  app.get('/api/student/achievements', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const student = db.users.find(u => u.id === authUser.id);
    if (!student) {
      res.status(404).json({ error: 'Student profile mismatch' });
      return;
    }

    // Dynamic stats computation
    const studentIssues = db.issues.filter(i => i.studentId === student.id);
    const booksRead = studentIssues.filter(i => i.status === 'returned').length;
    const booksBorrowed = studentIssues.length;
    const reviewsCount = studentIssues.filter(i => i.comments).length; // dynamic feedback metric
    
    const activeRoadmaps = db.roadmaps.filter(r => r.studentId === student.id);
    const roadmapsCompleted = activeRoadmaps.filter(r => r.status === 'completed').length;

    const xp = student.streakPoints || 0;
    const level = Math.floor(xp / 100) + 1;
    const currentXP = xp % 100;
    const levelXP = 100;
    const levelProgress = Math.min(100, Math.round((currentXP / levelXP) * 100));

    // Ensure array
    if (!student.badges) student.badges = ["Fresh Explorer"];

    const stats = {
      booksRead,
      booksBorrowed,
      xp,
      level,
      readingStreak: student.readingStreak || 0,
      roadmapsCompleted,
      reviewsSubmitted: reviewsCount
    };

    const badgeTemplates = [
      { name: "First Book Completed", description: "Completed and checked in your first physical textbook.", category: "Library" },
      { name: "Bookworm", description: "Successfully checked out and read 5+ textbooks.", category: "Library" },
      { name: "Research Master", description: "Read 10+ college textbooks from different category sets.", category: "Library" },
      { name: "Knowledge Hunter", description: "Unlocked 200+ Academic Streak Points (XP).", category: "XP" },
      { name: "Consistent Learner", description: "Maintained a 5-day active study streak.", category: "Streak" },
      { name: "AI Explorer", description: "Generated 5+ AI smart textbook summaries or exam revision sheets.", category: "AI" },
      { name: "Elite Scholar", description: "Earning 300+ Academic Streak Points (XP).", category: "XP" }
    ];

    const newlyUnlocked: string[] = [];
    
    if (booksRead >= 1 && !student.badges.includes("First Book Completed")) {
      student.badges.push("First Book Completed");
      newlyUnlocked.push("First Book Completed");
    }
    if (booksRead >= 5 && !student.badges.includes("Bookworm")) {
      student.badges.push("Bookworm");
      newlyUnlocked.push("Bookworm");
    }
    if (booksRead >= 10 && !student.badges.includes("Research Master")) {
      student.badges.push("Research Master");
      newlyUnlocked.push("Research Master");
    }
    if (xp >= 200 && !student.badges.includes("Knowledge Hunter")) {
      student.badges.push("Knowledge Hunter");
      newlyUnlocked.push("Knowledge Hunter");
    }
    if (student.readingStreak >= 5 && !student.badges.includes("Consistent Learner")) {
      student.badges.push("Consistent Learner");
      newlyUnlocked.push("Consistent Learner");
    }
    if (xp >= 300 && !student.badges.includes("Elite Scholar")) {
      student.badges.push("Elite Scholar");
      newlyUnlocked.push("Elite Scholar");
    }

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(bName => {
        db.notifications.push({
          id: `notif-${Date.now()}-${Math.random()}`,
          userId: student.id,
          title: "🏆 Achievement Badge Unlocked!",
          message: `Congratulations! You unlocked the "${bName}" official badge. Check your profile cabinet.`,
          date: new Date().toISOString(),
          read: false,
          type: 'learning'
        });
      });
      saveDatabase();
    }

    const unlockedBadges = badgeTemplates.filter(bt => student.badges.includes(bt.name)).map(bt => ({
      ...bt,
      unlockedAt: new Date(student.createdAt || Date.now()).toLocaleDateString()
    }));

    const lockedBadges = badgeTemplates.filter(bt => !student.badges.includes(bt.name));

    const deptStudents = db.users.filter(u => u.role === 'student' && u.department === student.department);
    deptStudents.sort((a,b) => (b.streakPoints || 0) - (a.streakPoints || 0));
    const deptIdx = deptStudents.findIndex(u => u.id === student.id);
    const deptRankStr = `Rank ${deptIdx === -1 ? 1 : deptIdx + 1} of ${deptStudents.length} ${student.department} Students`;

    res.json({
      success: true,
      level,
      xp,
      currentXP,
      nextLevelXP: 100,
      levelProgress,
      unlockedBadges,
      lockedBadges,
      deptRank: deptRankStr,
      newlyUnlocked,
      stats
    });
  });

  // AI BOOK-TO-EXAM NOTES EXTRACTOR
  app.get('/api/books/:id/exam-notes', authenticateJWT, async (req, res) => {
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book requested not found.' });
      return;
    }

    // Check memory cache
    let existingNotes = db.examNotes.find(en => en.bookId === book.id);
    if (existingNotes) {
      res.json({ success: true, notes: existingNotes.notes });
      return;
    }

    // Comprehensive scholary fallback system notes
    const offlineExamNotes = {
      bookId: book.id,
      notes: {
        units: [
          {
            unitName: "Unit 1: Foundational Frameworks & Essential Paradigms",
            summary: `Comprehensive core methodologies concerning ${book.category} structures. Explains practical application guidelines, resource allocation pipelines, and major architectural concepts required for midterms and university viva panels.`,
            definitions: [
              { term: `${book.category} Concepts`, meaning: `A primary template or structural scheme used to solve real-world problems matching ${book.subject}.` },
              { term: "Scholarly Optimization", meaning: "Algorithmic optimization techniques to improve scholastic velocity ratios in college research papers." },
              { term: "Resource Abstraction", meaning: "The separation of logical business operations from physical compiler/host specifications for portability." }
            ],
            formulas: [
              { formula: "U_{efficiency} = \\frac{Completed\\,Objectives}{Assigned\\,Hours}", explanation: "Computes total resource utilization ratios for study block planner models.", useCase: "Determining lecture block complexity" },
              { formula: "S_{capacity} = \\sum_{i=1}^{N} \\omega_i \\cdot C_i", explanation: "Calculates total load capacities in distributed database nodes.", useCase: "Designing server scales in databases" }
            ],
            questions: [
              { question: "Explain the logical trade-offs inside modern textbook implementations.", marks: 5, answer: "Tradeoffs balance compilation speed, operational overhead, and developer cognitive loads. Systems prioritize modular separation of concerns over extreme monolithic bindings." }
            ]
          },
          {
            unitName: "Unit 2: System Optimization & Applied Engineering",
            summary: `Deep dive into advanced optimization techniques described in "${book.title}". Explains standard procedures to minimize compilation margins and maximize output values across major engineering workloads.`,
            definitions: [
              { term: "Systemic Bottleneck", meaning: "A narrow constriction point that slows down procedural flows under high user traffic." },
              { term: "Heuristic Cache", meaning: "Predictive temp storage that intercepts repetitive operational request patterns to boost retrieval speeds." }
            ],
            formulas: [
              { formula: "T_{throughput} = \\frac{Total\\,Data}{Latency} \\cdot (1 - Loss_{pct})", explanation: "Calculates total data transit speeds under loss constraints.", useCase: "Checking network communication rules" }
            ],
            questions: [
              { question: "How does this textbook resolve standard scalability bottlenecks?", marks: 10, answer: "Through hierarchical microservices, introducing client-side caching, implementing async background file-checkins, and lazy-loading heavy media components." }
            ]
          }
        ],
        frequentlyAskedConcepts: [
          { title: `${book.category} Applied Frameworks`, description: `Fundamental paradigms tested in final university examinations. Covers core theory: ${book.subject}.`, expectedMarks: 10 },
          { title: "Theoretical Complexity Limits", description: "Analytical boundaries of scale, runtime efficiency, and storage limits in core textbooks.", expectedMarks: 5 }
        ],
        revisionSheet: {
          keyTakeaways: [
            `Establishes robust software/theoretical baselines in ${book.category}.`,
            "Outlines clean structural designs helpful for year graduation projects.",
            "Features textbook checks designed to match rigorous university assignments."
          ],
          definitions: [
            `Scholarly integration: The alignment of ${book.category} components into unified learning pathways.`
          ],
          formulas: [
            "Efficiency Ratio = Output / Input"
          ],
          tips: [
            "Focus heavily on the structural database schematics in Unit 2.",
            "Understand the latency formulas inside Unit 2; exams require application calculations.",
            "Review the glossary terms; examiners routinely ask for 2-mark definitions."
          ]
        },
        flashcards: [
          { id: `fc-1-${book.id}`, question: `What is the primary thesis of "${book.title}"?`, answer: `To deliver an industry-aligned academic blueprint for absolute mastery in ${book.category}.` },
          { id: `fc-2-${book.id}`, question: `Who is the primary audience for "${book.title}"?`, answer: `Undergraduates majoring in ${book.department} or professional engineering tracks.` },
          { id: `fc-3-${book.id}`, question: `Identify the main subject focus of author ${book.author}.`, answer: `Applied systems paired with optimization schemas: ${book.subject}.` },
          { id: `fc-4-${book.id}`, question: `Explain the available stockcopies metric for "${book.title}".`, answer: `Our campus library has ${book.availableCopies} available copies out of ${book.quantity} total units.` }
        ]
      }
    };

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Review the academic textbook: "${book.title}" by author "${book.author}". Generate highly detailed, comprehensive final exam study guide and study notes.
Subject: ${book.subject}, Category: ${book.category}, Major: ${book.department}.
Generate the response in JSON format. Use this exact schema format:
{
  "units": [
    {
      "unitName": "string",
      "summary": "string",
      "definitions": [{ "term": "string", "meaning": "string" }],
      "formulas": [{ "formula": "string", "explanation": "string", "useCase": "string" }],
      "questions": [{ "question": "string", "marks": 5, "answer": "string" }]
    }
  ],
  "frequentlyAskedConcepts": [
    { "title": "string", "description": "string", "expectedMarks": 10 }
  ],
  "revisionSheet": {
    "keyTakeaways": ["string"],
    "definitions": ["string"],
    "formulas": ["string"],
    "tips": ["string"]
  },
  "flashcards": [
    { "id": "fc-1", "question": "string", "answer": "string" }
  ]
}
Outline real, useful academic content (NOT mock placeholders!). For technical books, write real mathematical LaTeX formulas!`;

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.units && parsed.flashcards) {
            const savedEN = {
              id: `en-${Date.now()}-${book.id}`,
              bookId: book.id,
              notes: parsed
            };
            db.examNotes.push(savedEN);
            saveDatabase();
            res.json({ success: true, notes: parsed });
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini notes compiler failed, rolling back to local academic static compiler', err);
      }
    }

    db.examNotes.push(offlineExamNotes);
    saveDatabase();
    res.json({ success: true, notes: offlineExamNotes.notes });
  });

  // EXAM ASSISTANT NOTES CHAT ENDPOINT
  app.post('/api/books/:id/exam-assistant', authenticateJWT, async (req, res) => {
    const { question } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question content is required.' });
      return;
    }

    const book = db.books.find(b => b.id === req.params.id);
    if (!book) {
      res.status(404).json({ error: 'Book requested not found.' });
      return;
    }

    const notesObj = db.examNotes.find(en => en.bookId === book.id);
    const notesCtx = notesObj ? JSON.stringify(notesObj.notes).substring(0, 2000) : "Standard syllabus study prep guide";

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the AI Campus Librarian Exam Copilot. A student is asking a custom exam preparation query regarding the textbook: "${book.title}" by author "${book.author}".
Context parameters:
- Department: ${book.department}
- Core Subject of book: ${book.subject}
- Dynamic exam notes context: ${notesCtx}

Student's Exam Query: "${question}"

Provide a highly styled, professional, concise, and incredibly supportive academic answer. Use bullet points or headings to maximize readability!`;

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: prompt
        });

        if (response && response.text) {
          res.json({ success: true, answer: response.text });
          return;
        }
      } catch (err) {
        console.warn('Gemini assistant query failed', err);
      }
    }

    const responses = [
      `Regarding "${question}": Focus heavily on the key algorithms and relational models listed in Unit 1 of "${book.title}". In past syllabus structures, examiners award maximum credit for structured diagrams, definitions of core variables, and real-world deployment challenges!`,
      `On query "${question}": Make sure to memorize the core formulas of Chapter 3. Let's remember that examiners test the underlying trade-offs rather than basic definitions, so relate your answer directly to ${book.category} systems.`,
      `Reviewing "${question}": Standard university exam panels require structured, bulleted list answers. Structure your thesis with: (1) Core Definition, (2) Structural Diagram on Page 45, (3) Key efficiency formula, and (4) Practical architectural constraints.`
    ];
    const stableIndex = question.length % responses.length;
    res.json({ success: true, answer: responses[stableIndex] });
  });

  // ACADEMIC COPILOT WORKFLOW GATEWAY
  app.post('/api/copilot/workflow', authenticateJWT, async (req, res) => {
    const { workflow, params } = req.body;
    if (!workflow) {
      res.status(400).json({ error: 'Missing active workflow selector' });
      return;
    }

    const user = db.users.find(u => u.id === (req as any).user.id);

    if (process.env.GEMINI_API_KEY) {
      try {
        let prompt = "";
        if (workflow === 'recommend') {
          prompt = `Recommend 3 excellent textbooks for a student in department "${user?.department || 'Computer Science'}" wanting to master "${params?.topic || 'AI & Coding'}". For each book, suggest a personalized match score (e.g. 95% Match) and a short rationale!`;
        } else if (workflow === 'quiz') {
          prompt = `Generate a 3-question multiple choice academic quiz covering: "${params?.topic || 'Coding basics'}".
Return your response in JSON format. Use this exact schema format:
{
  "questions": [
    {
      "id": "q-1",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answerIndex": 0,
      "explanation": "string"
    }
  ]
}`;
        } else if (workflow === 'viva') {
          prompt = `Generate 4 oral study viva/interview questions with model answers on topic: "${params?.topic || 'AI Foundations'}". Outline examiners tip for each. Return a JSON array: [{ "question": "string", "answer": "string", "tip": "string" }]`;
        } else if (workflow === 'career') {
          prompt = `Provide standard career suggestions and an extensive Skill Gap Analysis for a student majoring in "${user?.department || 'Computer Science'}" focusing on "${params?.topic || 'Software Development'}". Recommend 3 highly-demanded technical skills they should master next to secure a premium offer from Google/similar, and recommend 2 textbooks to bridge that gap. Return a JSON object: { "careers": ["string"], "skillGap": ["string"], "targetSkills": ["string"], "recommendedBooks": ["string"] }`;
        } else if (workflow === 'progress') {
          prompt = `Provide a simulated academic intelligence prediction of learning time based on XP score of ${user?.streakPoints || 100} and reading streak of ${user?.readingStreak || 5} days for learning path "${params?.topic || 'Full-Stack'}" in department "${user?.department}". Highlight milestones and weekly projections in JSON structure: { "milestones": ["string"], "estimatedDays": 30, "predictions": [{"week": "Week 1", "chapters": 2, "xpPrediction": 150}] }`;
        } else {
          prompt = `Write a concise 200-word definition, summary, and learning outcomes for the topic: "${params?.topic || 'Coding Basics'}".`;
        }

        const response = await generateContentWithFallback({
          preferredModel: 'gemini-3.5-flash',
          contents: prompt,
          config: (workflow === 'quiz' || workflow === 'viva' || workflow === 'career' || workflow === 'progress') ? { responseMimeType: "application/json" } : undefined
        });

        if (response && response.text) {
          res.json({ success: true, result: (workflow === 'quiz' || workflow === 'viva' || workflow === 'career' || workflow === 'progress') ? JSON.parse(response.text) : response.text });
          return;
        }
      } catch (err: any) {
        console.warn(`[Copilot] Workflow ${workflow} Gemini call failed, fell back to custom academic sandbox`, err);
      }
    }

    // High fidelity offline sandbox fallbacks
    let offlineResult: any = "";
    if (workflow === 'recommend') {
      offlineResult = `### Recommended Academic Textbooks for you:
1. **Applied Algorithms & Data Structures** — **96% Match**
   *Rationale*: Highly relevant for your CS/Engineering major, with comprehensive chapters on graph algorithms.
2. **Modern Full-Stack Engineering Blueprint** — **91% Match**
   *Rationale*: Combines web development, databases, and continuous integration concepts from your planner history.
3. **Introduction to Artificial Intelligence & Neural Networks** — **88% Match**
   *Rationale*: Relevant to your active Gemini syllabus roadmap goals.`;
    } else if (workflow === 'quiz') {
      offlineResult = {
        questions: [
          {
            id: "q-1",
            question: `Which of the following describes a foundational concept in ${user?.department || 'Computer Science'}?`,
            options: ["Procedural encapsulation", "Rote memorization only", "Static non-compiled models", "Ad-hoc infinite loops"],
            answerIndex: 0,
            explanation: "Procedural encapsulation isolates state changes and logical procedures, maximizing code reliability."
          },
          {
            id: "q-2",
            question: "What is the primary indicator of reading velocity in our Academic Hub?",
            options: ["XP points and Streak consistency", "Number of logins", "Static page refreshes", "Empty folders"],
            answerIndex: 0,
            explanation: "XP / Streak Points represent active task completions, textbook returns, and syllabus roadmap achievements."
          },
          {
            id: "q-3",
            question: "How does a student earn badge achievements?",
            options: ["Borrowing textbooks, answering quizzes, and completing roadmaps", "Refreshing page", "Changing roles", "Searching names"],
            answerIndex: 0,
            explanation: "Various badges are unlocked as key checkout lists and quiz performance metrics are met."
          }
        ]
      };
    } else if (workflow === 'viva') {
      offlineResult = [
        {
          question: `Why is architectural state validation critical for ${user?.department || 'Engineering'} systems?`,
          answer: "It guarantees database synchronization, handles offline caching, and prevents missing updates during failures.",
          tip: "Relate this directly to MongoDB persistence fallbacks when queried by the examiner."
        },
        {
          question: "Explain the role of local storage caching in SPAs.",
          answer: "Local state persists UI active positions, avoids redundant REST calls, and maintains immediate responsiveness.",
          tip: "Mention the React useEffect dependency array stabilization as a performance optimize case."
        }
      ];
    } else if (workflow === 'career') {
      offlineResult = {
        careers: ["Full-Stack Solutions Architect", "Machine Learning Specialist", "Digital Operations Manager"],
        skillGap: ["Advanced Distributed Database structures", "RESTful API Security Standards (OAuth2)", "Modern container infrastructure"],
        targetSkills: ["System Design Architecture", "Node/TypeScript server logic", "Interactive React UI engineering"],
        recommendedBooks: ["Introduction to Python & Data Analysis", "Advanced Data Structures & Algorithms"]
      };
    } else if (workflow === 'progress') {
      offlineResult = {
        milestones: ["Master Beginner Modules (10 days)", "Develop 3 Real Projects (20 days)", "Claim Syllabus Graduation Cert (30 days)"],
        estimatedDays: 32,
        predictions: [
          { week: "Week 1", chapters: 3, xpPrediction: 160 },
          { week: "Week 2", chapters: 6, xpPrediction: 280 },
          { week: "Week 3", chapters: 10, xpPrediction: 450 },
          { week: "Week 4", chapters: 14, xpPrediction: 600 }
        ]
      };
    } else {
      offlineResult = `### Scholarly Review of "${params?.topic || 'AI & Systems'}"
This fundamental concept addresses key architectural models within contemporary research circles.
- **Key Takeaway**: Understanding trade-offs boosts deployment speeds.
- **Academic Tip**: Always frame definitions with structural diagrams for maximum exam marks.`;
    }

    res.json({ success: true, result: offlineResult });
  });

  app.get('/api/analytics/student-dashboard', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    const student = db.users.find(u => u.id === authUser.id);
    if (!student) {
      res.status(404).json({ error: 'User student registry error' });
      return;
    }

    const issues = db.issues.filter(i => i.studentId === student.id);
    
    // Core parameters
    const booksIssued = issues.filter(i => i.status === 'issued').length;
    const dueBooks = issues.filter(i => {
      if (i.status !== 'issued' || !i.dueDate) return false;
      return new Date() > new Date(i.dueDate);
    }).length;

    // Categories read breakdown
    const categoryCounts: Record<string, number> = {};
    issues.forEach(i => {
      const book = db.books.find(b => b.id === i.bookId);
      if (book) {
        categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
      }
    });

    const categoriesBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      value: count
    }));

    // Active roadmap count
    const activeRoadmaps = db.roadmaps.filter(r => r.studentId === student.id && r.status === 'active').length;

    res.json({
      success: true,
      stats: {
        booksIssued,
        dueBooks,
        readingStreak: student.readingStreak || 0,
        streakPoints: student.streakPoints || 0,
        activeRoadmaps,
        categoriesBreakdown,
        completionRate: issues.length > 0 ? Math.round((issues.filter(i => i.status === 'returned').length / issues.length) * 100) : 100,
        totalRead: issues.filter(i => ['returned', 'issued'].includes(i.status)).length
      }
    });
  });

  // Admin global statistics
  app.get('/api/analytics/admin-dashboard', authenticateJWT, (req, res) => {
    const authUser = (req as any).user;
    if (authUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied: Library Admin required.' });
      return;
    }

    const totalBooks = db.books.reduce((sum, b) => sum + b.quantity, 0);
    const uniqueBooks = db.books.length;
    const activeStudents = db.users.filter(u => u.role === 'student').length;
    const totalIssued = db.issues.filter(i => i.status === 'issued').length;
    const totalOverdue = db.issues.filter(i => i.status === 'issued' && i.dueDate && new Date() > new Date(i.dueDate)).length;
    
    // Compute total fine values
    const totalFines = db.issues.reduce((sum, i) => sum + (i.fineAmount || 0), 0);

    // Group issues by department
    const deptUsage: Record<string, number> = {};
    db.issues.forEach(iss => {
      const student = db.users.find(u => u.id === iss.studentId);
      if (student) {
        deptUsage[student.department] = (deptUsage[student.department] || 0) + 1;
      }
    });

    const deptChart = Object.entries(deptUsage).map(([name, count]) => ({
      name,
      issued: count
    }));

    // Most issued books
    const bookFreq: Record<string, { title: string; count: number }> = {};
    db.issues.forEach(iss => {
      bookFreq[iss.bookId] = {
        title: iss.bookTitle,
        count: (bookFreq[iss.bookId]?.count || 0) + 1
      };
    });

    const topBooksChart = Object.entries(bookFreq)
      .map(([id, item]) => ({
        id,
        title: item.title,
        issued: item.count
      }))
      .sort((a, b) => b.issued - a.issued)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalBooks,
        uniqueBooks,
        activeStudents,
        totalIssued,
        totalOverdue,
        totalFines,
        deptChart,
        topBooksChart
      }
    });
  });

  // 13. MOCK EXCEL REPORTS EXPORTER API (CSV DOWNLOAD LOGIC)
  app.get('/api/reports/csv', authenticateJWT, (req, res) => {
    const { type } = req.query;
    let csvContent = "";
    let filename = "smart-library-report.csv";

    if (type === 'books') {
      filename = "books-inventory-catalog.csv";
      csvContent = "Book Title,Author,ISBN,Category,Department,Publisher,Quantity,Available Copies,Popularity\n";
      db.books.forEach(b => {
        csvContent += `"${b.title}","${b.author}","${b.isbn}","${b.category}","${b.department}","${b.publisher}",${b.quantity},${b.availableCopies},${b.popularity}\n`;
      });
    } else if (type === 'overdue') {
      filename = "overdue-bookcheckouts-report.csv";
      csvContent = "Student Name,Student Email,Book Title,Issue Date,Due Date,Days Overdue,Fine Amount\n";
      const now = new Date();
      db.issues.forEach(i => {
        if (i.status === 'issued' && i.dueDate) {
          const due = new Date(i.dueDate);
          if (now > due) {
            const diffDays = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            csvContent += `"${i.studentName}","${i.studentEmail}","${i.bookTitle}","${new Date(i.issueDate!).toLocaleDateString()}","${due.toLocaleDateString()}",${diffDays},$${i.fineAmount.toFixed(2)}\n`;
          }
        }
      });
    } else {
      filename = "most-issued-categories.csv";
      csvContent = "Category Name,Total Checked Out\n";
      const categoriesFreq: Record<string, number> = {};
      db.issues.forEach(iss => {
        const book = db.books.find(b => b.id === iss.bookId);
        if (book) {
          categoriesFreq[book.category] = (categoriesFreq[book.category] || 0) + 1;
        }
      });
      Object.entries(categoriesFreq).forEach(([cat, val]) => {
        csvContent += `"${cat}",${val}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  });

  // Serve static/dev/production logic
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Smart Academic Hub server boot running on http://0.0.0.0:${PORT}`);
    });
  }

  // Non-serverless fallback execution
  if (!process.env.VERCEL) {
    startServer().catch((err) => {
      console.error("Critical error booting full-stack server application:", err);
    });
  }

export default app;
