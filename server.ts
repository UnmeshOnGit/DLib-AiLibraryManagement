import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { connectMongoDB, isMongoDBConnected, syncToMongoDB, seedAndLoadFromMongoDB, getMongoLastError } from "./mongodb";
import { isHashed, hashPassword, verifyPassword } from "./hash";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database File Path
const DB_FILE = path.join(process.cwd(), "db.json");

// Lazy-initialize Gemini API Client
let geminiClient: any = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return geminiClient;
}

// Default/Fallback Mock Database
const DEFAULT_BOOKS = [
  {
    id: "b1",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    isbn: "978-0262033848",
    department: "Computer Engineering",
    description: "A comprehensive guide to the study and analysis of computer algorithms with concrete descriptions and code.",
    rating: 4.8,
    totalCopies: 10,
    availableCopies: 8,
    category: "Algorithms",
    location: "Rack A-3, CS Department"
  },
  {
    id: "b2",
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth",
    isbn: "978-0078022135",
    department: "Computer Engineering",
    description: "The fundamental concepts of database management systems including SQL, transaction processing, and storage structures.",
    rating: 4.5,
    totalCopies: 8,
    availableCopies: 6,
    category: "Databases",
    location: "Rack B-1, CS Department"
  },
  {
    id: "b3",
    title: "Thermodynamics: An Engineering Approach",
    author: "Yunus A. Cengel, Michael A. Boles",
    isbn: "978-0073398174",
    department: "Mechanical Engineering",
    description: "A classic textbook that explains thermodynamics principles in an intuitive and clear way with practical engineering applications.",
    rating: 4.6,
    totalCopies: 5,
    availableCopies: 5,
    category: "Thermal Power",
    location: "Rack E-2, Mechanical Section"
  },
  {
    id: "b4",
    title: "Modern Control Engineering",
    author: "Katsuhiko Ogata",
    isbn: "978-0136156734",
    department: "Electrical Engineering",
    description: "Comprehensive coverage of continuous-time control systems, design methods, state space analysis, and feedback control.",
    rating: 4.4,
    totalCopies: 6,
    availableCopies: 4,
    category: "Control Systems",
    location: "Rack C-4, Electrical Section"
  },
  {
    id: "b5",
    title: "Chemical Reaction Engineering",
    author: "Octave Levenspiel",
    isbn: "978-0471254249",
    department: "Chemical Engineering",
    description: "Focuses on Chemical kinetics, reactors design, and mixing patterns in chemical processing operations.",
    rating: 4.3,
    totalCopies: 4,
    availableCopies: 3,
    category: "Reaction Engineering",
    location: "Rack H-1, Chemical Section"
  },
  {
    id: "b6",
    title: "Design of Steel Structures",
    author: "S. K. Duggal",
    isbn: "978-9351343516",
    department: "Civil Engineering",
    description: "Covers the design of structural steel elements, tension/compression members, beam-columns, and standard connections in civil systems.",
    rating: 4.7,
    totalCopies: 7,
    availableCopies: 6,
    category: "Structural Design",
    location: "Rack D-2, Civil Section"
  },
  {
    id: "b7",
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin",
    isbn: "978-1118063330",
    department: "Computer Engineering",
    description: "An instruction-focused explanation of processes, memory management, file systems, process coordination, and virtualization.",
    rating: 4.6,
    totalCopies: 12,
    availableCopies: 10,
    category: "Operating Systems",
    location: "Rack A-1, CS Department"
  },
  {
    id: "b8",
    title: "Power System Analysis",
    author: "Hadi Saadat",
    isbn: "978-0984545520",
    department: "Electrical Engineering",
    description: "An introduction to power systems transmission lines, power flow analysis, fault analysis, and power grid stability.",
    rating: 4.5,
    totalCopies: 5,
    availableCopies: 3,
    category: "Power Systems",
    location: "Rack C-1, Electrical Section"
  },
  {
    id: "b9",
    title: "Principles of Heat Transfer",
    author: "Frank Kreith, Raj M. Manglik",
    isbn: "978-1133310037",
    department: "Mechanical Engineering",
    description: "Presents conduction, convection, and radiation analysis with mathematical elegance and industrial thermal problem solutions.",
    rating: 4.2,
    totalCopies: 4,
    availableCopies: 4,
    category: "Thermal Power",
    location: "Rack E-3, Mechanical Section"
  },
  {
    id: "b10",
    title: "Introduction to Machine Learning",
    author: "Ethem Alpaydin",
    isbn: "978-0262028189",
    department: "Information Technology",
    description: "Covers supervised learning, neural networks, support vector machines, clustering, and smart predictive engineering.",
    rating: 4.7,
    totalCopies: 8,
    availableCopies: 5,
    category: "Artificial Intelligence",
    location: "Rack F-3, IT Department"
  },
  {
    id: "b11",
    title: "Elements of Chemical Reaction Engineering",
    author: "H. Scott Fogler",
    isbn: "978-0133819281",
    department: "Chemical Engineering",
    description: "Argues reactor safety, catalytic systems, nonisothermal designs, steady-state reactors, and reaction kinetics of chemical systems.",
    rating: 4.5,
    totalCopies: 6,
    availableCopies: 3,
    category: "Reaction Engineering",
    location: "Rack H-2, Chemical Section"
  },
  {
    id: "b12",
    title: "Structural Analysis & Steel Design",
    author: "S. S. Bhavikatti",
    isbn: "978-9351343714",
    department: "Civil Engineering",
    description: "Elementary theories of civil beams, truss deflections, joint rigidities, and modern practices in civil construction design.",
    rating: 4.4,
    totalCopies: 8,
    availableCopies: 6,
    category: "Structural Design",
    location: "Rack D-1, Civil Section"
  },
  {
    id: "b13",
    title: "Design of Machine Elements",
    author: "V.B. Bhandari",
    isbn: "978-9351342847",
    department: "Mechanical Engineering",
    description: "Covers standard engineering practices for shafts, helical gears, couplings, design limits, and wear fatigue parameters.",
    rating: 4.6,
    totalCopies: 10,
    availableCopies: 8,
    category: "Mechanical Design",
    location: "Rack E-4, Mechanical Section"
  },
  {
    id: "b14",
    title: "Advanced Engineering Mathematics",
    author: "N.P. Bali, Manish Goyal",
    isbn: "978-9380856827",
    department: "Information Technology",
    description: "Focuses on complex variables, Fourier transforms, partial differential formulas, and numerical computing integrations.",
    rating: 4.8,
    totalCopies: 12,
    availableCopies: 10,
    category: "Mathematics",
    location: "Rack F-1, IT Department"
  }
];

const DEFAULT_USERS = [
  {
    id: "u1",
    rollNumber: "DBATU1001",
    name: "Omkar Suryavanshi",
    email: "omkar.s@student.dbatu.ac.in",
    password: "password123",
    role: "student",
    branch: "Computer Engineering",
    interests: ["Algorithms", "Databases", "Artificial Intelligence"]
  },
  {
    id: "u2",
    rollNumber: "DBATU1002",
    name: "Shivani Patil",
    email: "shivani.p@student.dbatu.ac.in",
    password: "password123",
    role: "student",
    branch: "Electrical Engineering",
    interests: ["Control Systems", "Power Systems"]
  },
  {
    id: "admin",
    rollNumber: "DBATUADMIN",
    name: "Dr. S. R. Mahajan",
    email: "sr.mahajan@dbatu.ac.in",
    password: "adminpassword",
    role: "admin",
  }
];

const DEFAULT_ISSUES = [
  {
    id: "i1",
    bookId: "b1",
    bookTitle: "Introduction to Algorithms",
    studentId: "u1",
    studentName: "Omkar Suryavanshi",
    requestDate: "2026-05-18",
    dueDate: "2026-06-01",
    durationDays: 14,
    status: "approved",
    fine: 2 // Assuming 1 day overdue today (given June 2, 2026 current time)
  },
  {
    id: "i2",
    bookId: "b4",
    bookTitle: "Modern Control Engineering",
    studentId: "u2",
    studentName: "Shivani Patil",
    requestDate: "2026-05-30",
    dueDate: "2026-06-13",
    durationDays: 14,
    status: "approved",
    fine: 0
  },
  {
    id: "i3",
    bookId: "b2",
    bookTitle: "Database System Concepts",
    studentId: "u1",
    studentName: "Omkar Suryavanshi",
    requestDate: "2026-06-01",
    durationDays: 7,
    status: "pending",
    fine: 0
  }
];

const DEFAULT_FEEDBACKS = [
  {
    id: "f1",
    studentId: "u1",
    studentName: "Omkar Suryavanshi",
    rating: 5,
    comment: "The recommended books are extremely helpful for our DBATU semester exams! The UI is flawless.",
    category: "General System",
    timestamp: "2026-06-01T15:20:00Z"
  },
  {
    id: "f2",
    studentId: "u2",
    studentName: "Shivani Patil",
    rating: 4,
    comment: "Great system! Can we add more reference textbooks for Electronics department?",
    category: "Content Catalog",
    timestamp: "2026-06-02T01:30:00Z"
  }
];

const DEFAULT_LOGS = [
  {
    id: "log_1",
    timestamp: "2026-06-01T09:00:00Z",
    userId: "u1",
    userName: "Omkar Suryavanshi",
    userRole: "student",
    action: "auth_login",
    details: "Logged in and completed OTP verification code.",
    ipAddress: "127.0.0.1"
  },
  {
    id: "log_2",
    timestamp: "2026-06-01T09:05:00Z",
    userId: "u1",
    userName: "Omkar Suryavanshi",
    userRole: "student",
    action: "search_books",
    details: "Searched for query 'Algorithms' in Computer Engineering dept"
  },
  {
    id: "log_3",
    timestamp: "2026-06-01T09:12:00Z",
    userId: "u1",
    userName: "Omkar Suryavanshi",
    userRole: "student",
    action: "generate_roadmap",
    details: "Requested Machine Learning Skill Roadmap from smart generator engine"
  }
];

// Active DB references inside server
let db: {
  books: typeof DEFAULT_BOOKS;
  users: typeof DEFAULT_USERS;
  issues: any[];
  feedbacks: typeof DEFAULT_FEEDBACKS;
  logs: typeof DEFAULT_LOGS;
  userRoadmaps: any[];
} = {
  books: DEFAULT_BOOKS,
  users: DEFAULT_USERS,
  issues: DEFAULT_ISSUES,
  feedbacks: DEFAULT_FEEDBACKS,
  logs: DEFAULT_LOGS,
  userRoadmaps: []
};

// Temp store for login OTPs. Key: rollNumber, value { code: string, expires: number }
const loginOtps = new Map<string, { code: string; expires: number; userData: any }>();

// Load DB from file
async function loadDB() {
  try {
    // Attempt MongoDB linkage
    const mongoConnected = await connectMongoDB();
    if (mongoConnected) {
      const dbState = await seedAndLoadFromMongoDB({
        books: DEFAULT_BOOKS,
        users: DEFAULT_USERS,
        issues: DEFAULT_ISSUES,
        feedbacks: DEFAULT_FEEDBACKS,
        logs: DEFAULT_LOGS
      });
      if (dbState) {
        db = dbState;
        console.log("[MongoDB Manager] Core records successfully initialized from Atlas DB.");
        
        let upgraded = false;
        for (const u of db.users) {
          if (!isHashed(u.password)) {
            u.password = hashPassword(u.password);
            upgraded = true;
          }
        }
        if (upgraded) {
          saveDB();
        }
        return;
      }
    }
  } catch (mongoErr) {
    console.error("[MongoDB Manager] Error during Mongo session initialization, fallback active.", mongoErr);
  }

  // File system fallback loading
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db = {
        books: parsed.books || DEFAULT_BOOKS,
        users: parsed.users || DEFAULT_USERS,
        issues: parsed.issues || DEFAULT_ISSUES,
        feedbacks: parsed.feedbacks || DEFAULT_FEEDBACKS,
        logs: parsed.logs || DEFAULT_LOGS,
        userRoadmaps: parsed.userRoadmaps || []
      };
      console.log("DB safely loaded from local", DB_FILE);
    } else {
      saveDB();
    }

    let upgraded = false;
    for (const u of db.users) {
      if (!isHashed(u.password)) {
        u.password = hashPassword(u.password);
        upgraded = true;
      }
    }
    if (upgraded) {
      saveDB();
    }
  } catch (err) {
    console.error("Failed to load schema DB JSON, falling back to in-memory: ", err);
  }
}

// Save DB to file
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");

    // Asynchronously update MongoDB without blocking current API thread completion
    if (isMongoDBConnected()) {
      syncToMongoDB(db).catch(err => {
        console.error("[MongoDB Async Engine] Synchronization background error: ", err);
      });
    }
  } catch (err) {
    console.error("Failed to serialize database state:", err);
  }
}

// Custom Logger Helper
function logActivity(userId: string, userName: string, role: "student" | "admin", action: string, details: string, ip?: string) {
  const newLog = {
    id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    userRole: role,
    action,
    details,
    ipAddress: ip || "unknown"
  };
  db.logs.unshift(newLog);
  // Keep logs list capped at 500 records to save memory
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  saveDB();
}

// Initial DB pull is loaded asynchronously inside initServer startup hook

// Dynamic fine calculator helper
function calculateAllFines() {
  const today = new Date("2026-06-02T07:13:59Z"); // DBATU current simulated clock time
  let changed = false;
  db.issues.forEach((issue) => {
    if (issue.status === "approved" && issue.dueDate) {
      const dueDateObj = new Date(issue.dueDate);
      if (today > dueDateObj) {
        const diffMs = today.getTime() - dueDateObj.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const computedFine = diffDays * 2; // Flat 2 Rs per day fine
        if (issue.fine !== computedFine) {
          issue.fine = computedFine;
          changed = true;
        }
      }
    }
  });
  if (changed) saveDB();
}

// Periodically compute fines
calculateAllFines();

// ---------------- API ENDPOINTS ----------------

// 1. Auth: Submit Login Credentials
app.post("/api/auth/login", (req, res) => {
  const { rollNumber, password } = req.body;
  if (!rollNumber || !password) {
    return res.status(400).json({ error: "Roll Number and Password are required." });
  }

  const user = db.users.find(
    (u) => u.rollNumber.toLowerCase() === rollNumber.toLowerCase()
  );

  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials. Please verify your DBATU student roll ID/librarian password." });
  }

  // Assert admin-gated student approval check
  if (user.role === "student" && (user as any).approved === false) {
    return res.status(403).json({
      error: "Your student registration is active but pending administrative approval. Please contact Dr. S. R. Mahajan to process your approval."
    });
  }

  // Return authenticated user immediately without 2FA step
  return res.json({
    success: true,
    user: {
      id: user.id,
      rollNumber: user.rollNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: (user as any).branch,
      interests: (user as any).interests || []
    }
  });
});

// 2. Auth: Verify Two-Step 2FA Code
app.post("/api/auth/verify2fa", (req, res) => {
  const { rollNumber, otp } = req.body;
  if (!rollNumber || !otp) {
    return res.status(400).json({ error: "Roll ID and Verification standard OTP code are required." });
  }

  const key = rollNumber.toUpperCase();
  const activeOtp = loginOtps.get(key);

  if (!activeOtp) {
    return res.status(400).json({ error: "Two-step authorization attempt expired. Please request a new code." });
  }

  if (Date.now() > activeOtp.expires) {
    loginOtps.delete(key);
    return res.status(400).json({ error: "Code expired. Request a new OTP credentials token." });
  }

  if (activeOtp.code !== otp) {
    return res.status(401).json({ error: "Verification code incorrect. Please look closely at the simulated OTP." });
  }

  // Authentication fully successful!
  const userData = activeOtp.userData;
  loginOtps.delete(key);

  // System Audit Logging
  logActivity(userData.id, userData.name, userData.role, "auth_login", `Completed Multi-Factor 2-step registration check. Node active session started for DBATU campus.`);

  return res.json({
    success: true,
    user: {
      id: userData.id,
      rollNumber: userData.rollNumber,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      branch: userData.branch,
      interests: userData.interests
    }
  });
});

// Auth: Register/Sign-up Student (Pending Admin Approval)
app.post("/api/auth/register", (req, res) => {
  const { rollNumber, name, email, password, branch } = req.body;
  
  if (!rollNumber || !name || !email || !password || !branch) {
    return res.status(400).json({ error: "All registration parameters are required." });
  }

  const normalizedRoll = rollNumber.toUpperCase();
  const exists = db.users.find(u => u.rollNumber.toUpperCase() === normalizedRoll);
  if (exists) {
    return res.status(400).json({ error: "A DBATU student with this Roll ID is already registered." });
  }

  const emailExists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(400).json({ error: "Email address is already linked with another account." });
  }

  const newUser = {
    id: "u_" + Date.now(),
    rollNumber: normalizedRoll,
    name,
    email,
    password: hashPassword(password),
    role: "student",
    branch,
    interests: [],
    approved: false // Admin approval required first prior to active status
  };

  db.users.push(newUser as any);
  saveDB();

  logActivity(
    newUser.id, 
    newUser.name, 
    "student", 
    "student_register", 
    `Student registered account for branch ${branch}. Awaiting librarian audit.`
  );

  return res.json({
    success: true,
    message: "Your application has been logged on the portal! Dr. S. R. Mahajan must audit and approve your request before you can log in."
  });
});

// Admin: Get Pending Student Signups
app.get("/api/admin/pending-students", (req, res) => {
  // Return all students whose approved property is explicitly false
  const pending = db.users.filter(u => u.role === "student" && (u as any).approved === false);
  return res.json(pending);
});

// Admin: Approve Student Signup Request
app.post("/api/admin/approve-student", (req, res) => {
  const { studentId, adminId, adminName } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required for approval." });
  }

  const student = db.users.find(u => u.id === studentId);
  if (!student) {
    return res.status(444).json({ error: "Student record was not found." });
  }

  (student as any).approved = true;
  saveDB();

  logActivity(
    adminId || "admin",
    adminName || "Dr. S. R. Mahajan",
    "admin",
    "approve_student",
    `Approved student account for ${student.name} (${student.rollNumber}).`
  );

  return res.json({ success: true, message: `Access approved for registration of student ${student.name}.` });
});

// Admin: Reject/Delete Student Signup Request
app.post("/api/admin/reject-student", (req, res) => {
  const { studentId, adminId, adminName } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required." });
  }

  const index = db.users.findIndex(u => u.id === studentId);
  if (index === -1) {
    return res.status(444).json({ error: "Student record was not found." });
  }

  const studentNameLoc = db.users[index].name;
  const studentRollLoc = db.users[index].rollNumber;

  db.users.splice(index, 1);
  saveDB();

  logActivity(
    adminId || "admin",
    adminName || "Dr. S. R. Mahajan",
    "admin",
    "reject_student",
    `Denied and purged sign-up request of student ${studentNameLoc} (${studentRollLoc}).`
  );

  return res.json({ success: true, message: `Purged registration request of ${studentNameLoc}.` });
});

// 3. Books: Fetch Book Catalog
app.get("/api/books", (req, res) => {
  calculateAllFines();
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";
  const dept = typeof req.query.dept === "string" ? req.query.dept : "";

  let result = [...db.books];

  if (search) {
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(search) ||
        b.author.toLowerCase().includes(search) ||
        b.isbn.includes(search) ||
        b.category.toLowerCase().includes(search)
    );
  }

  if (dept && dept !== "All") {
    result = result.filter((b) => b.department === dept);
  }

  return res.json(result);
});

// 4. Books: Add Book (Admin Only)
app.post("/api/books", (req, res) => {
  const { title, author, isbn, department, description, totalCopies, category, location, adminId, adminName } = req.body;

  if (!title || !author || !isbn || !department || !category) {
    return res.status(400).json({ error: "Required fields missing for inventory indexing." });
  }

  const newBook = {
    id: "b_" + Date.now(),
    title,
    author,
    isbn,
    department,
    description: description || "Reference engineering manual for DBATU tech curriculums.",
    rating: 4.0,
    totalCopies: Number(totalCopies) || 5,
    availableCopies: Number(totalCopies) || 5,
    category,
    location: location || "Central Library DBATU"
  };

  db.books.push(newBook);
  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "add_book", `Added new technical text reference: '${title}' indexed in ${category}.`);

  return res.json({ success: true, book: newBook });
});

// 5. Books: Update Book (Admin Only)
app.put("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, department, description, totalCopies, availableCopies, category, location, adminId, adminName } = req.body;

  const bIndex = db.books.findIndex((b) => b.id === id);
  if (bIndex === -1) {
    return res.status(404).json({ error: "Indexed book reference not found." });
  }

  const existing = db.books[bIndex];

  db.books[bIndex] = {
    ...existing,
    title: title || existing.title,
    author: author || existing.author,
    isbn: isbn || existing.isbn,
    department: department || existing.department,
    description: description || existing.description,
    totalCopies: totalCopies !== undefined ? Number(totalCopies) : existing.totalCopies,
    availableCopies: availableCopies !== undefined ? Number(availableCopies) : existing.availableCopies,
    category: category || existing.category,
    location: location || existing.location
  };

  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "edit_book", `Modified catalog parameters for book: '${existing.title}'. Updated total copies.`);

  return res.json({ success: true, book: db.books[bIndex] });
});

// 6. Books: Delete Book (Admin Only)
app.delete("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const book = db.books.find((b) => b.id === id);
  if (!book) {
    return res.status(404).json({ error: "Book not found." });
  }

  db.books = db.books.filter((b) => b.id !== id);
  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "delete_book", `Permanently removed book reference ID '${id}' ('${book.title}') from централ DBATU databases.`);

  return res.json({ success: true });
});

// 7. Issues: Get Issued Items List
app.get("/api/issues", (req, res) => {
  calculateAllFines();
  const { studentId, role } = req.query;

  let result = [...db.issues];

  if (role === "student" && studentId) {
    result = result.filter((i) => i.studentId === studentId);
  }

  return res.json(result);
});

// 8. Issues: Request Book Checkout (Student Action)
app.post("/api/issues/request", (req, res) => {
  const { bookId, studentId, studentName, durationDays } = req.body;

  if (!bookId || !studentId || !studentName) {
    return res.status(400).json({ error: "Invalid reservation or checkout request variables." });
  }

  const book = db.books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: "Book registry invalid." });
  }

  // Check if they already have an active request or checkout on this same book
  const alreadyRequested = db.issues.some(
    (i) => i.studentId === studentId && i.bookId === bookId && (i.status === "pending" || i.status === "approved" || i.status === "renewal_pending")
  );

  if (alreadyRequested) {
    return res.status(400).json({ error: "You already hold an active checkout, renewal, or pending request for this classic engineering book." });
  }

  // If book is available, we submit standard pending checkout request
  // If unavailable (availableCopies <= 0), we submit a RESERVATION pending notice!
  const isReserve = book.availableCopies <= 0;

  const newRequest: any = {
    id: "i_" + Date.now(),
    bookId,
    bookTitle: book.title,
    studentId,
    studentName,
    requestDate: new Date().toISOString().split("T")[0],
    durationDays: Number(durationDays) || 14,
    status: "pending",
    fine: 0
  };

  db.issues.push(newRequest);
  saveDB();

  const activityMsg = isReserve 
    ? `Created reservation list request for out-of-stock book '${book.title}'` 
    : `Created issue checkout request for book '${book.title}' (Requested days: ${durationDays})`;

  logActivity(studentId, studentName, "student", "issue_request", activityMsg);

  return res.json({ success: true, request: newRequest, isReserve });
});

// 9. Issues: Approve Issue (Admin Only)
app.post("/api/issues/approve/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const issueIndex = db.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Record tracker not located." });
  }

  const issue = db.issues[issueIndex];
  const book = db.books.find((b) => b.id === issue.bookId);

  if (!book) {
    return res.status(404).json({ error: "Related catalog asset is missing." });
  }

  if (book.availableCopies <= 0) {
    return res.status(400).json({ error: "No physical copies of this textbook left in DBATU Central inventory. Cannot approve checkout." });
  }

  // Deduct available inventory
  book.availableCopies -= 1;

  // Set due dates
  const reqDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(reqDate.getDate() + (issue.durationDays || 14));

  db.issues[issueIndex] = {
    ...issue,
    status: "approved",
    dueDate: dueDate.toISOString().split("T")[0],
  };

  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "approve_issue", `Librarian approved textbook allocation for '${issue.studentName}' (${issue.bookTitle}). Due Date: ${dueDate.toISOString().split("T")[0]}`);

  return res.json({ success: true, issue: db.issues[issueIndex] });
});

// 10. Issues: Reject Issue (Admin Only)
app.post("/api/issues/reject/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const issueIndex = db.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Record not found." });
  }

  db.issues[issueIndex].status = "rejected";
  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "reject_issue", `Librarian rejected checkout clearance request of '${db.issues[issueIndex].studentName}' on book '${db.issues[issueIndex].bookTitle}'.`);

  return res.json({ success: true, issue: db.issues[issueIndex] });
});

// 11. Issues: Request Renewal (Student Action)
app.post("/api/issues/renew/:id", (req, res) => {
  const { id } = req.params;
  const { studentId, studentName, renewalDays } = req.body;

  const issueIndex = db.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Active issue parameter reference invalid." });
  }

  const issue = db.issues[issueIndex];
  if (issue.status !== "approved") {
    return res.status(400).json({ error: "You can only request renewals for active, approved textbook issues." });
  }

  db.issues[issueIndex] = {
    ...issue,
    status: "renewal_pending",
    durationDays: (issue.durationDays || 14) + (Number(renewalDays) || 7)
  };

  saveDB();

  logActivity(studentId, studentName, "student", "renew_request", `Submitted formal renewal appeal for book: '${issue.bookTitle}' (+${renewalDays} days).`);

  return res.json({ success: true, issue: db.issues[issueIndex] });
});

// 11b. Issues: Approve Renewal (Admin Action)
app.post("/api/issues/approve-renewal/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const issueIndex = db.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue parameter reference invalid." });
  }

  const issue = db.issues[issueIndex];
  
  // Extend due date based on duration days
  const currentDueDate = issue.dueDate ? new Date(issue.dueDate) : new Date();
  currentDueDate.setDate(currentDueDate.getDate() + 7); // Adds standard extra week on approval

  db.issues[issueIndex] = {
    ...issue,
    status: "approved",
    dueDate: currentDueDate.toISOString().split("T")[0]
  };

  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "approve_renewal", `Librarian cleared renewal expansion for '${issue.studentName}' (${issue.bookTitle}). Extended standard due date to: ${currentDueDate.toISOString().split("T")[0]}`);

  return res.json({ success: true, issue: db.issues[issueIndex] });
});

// 12. Issues: Mark Return (Approved / Admin Action)
app.post("/api/issues/return/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const issueIndex = db.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue registration not found." });
  }

  const issue = db.issues[issueIndex];
  const book = db.books.find((b) => b.id === issue.bookId);

  if (book) {
    book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
  }

  db.issues[issueIndex] = {
    ...issue,
    status: "returned",
    returnDate: new Date().toISOString().split("T")[0]
  };

  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "return_book", `Librarian closed checkout catalog loops. Return registered for '${issue.studentName}' handling '${issue.bookTitle}'. Checked out fines settled.`);

  return res.json({ success: true, issue: db.issues[issueIndex] });
});

// 13. Smart Recommendations API (Uses Gemini server-side or local heuristics)
app.post("/api/recommend", async (req, res) => {
  const { studentName, branch, interests, readingHistory } = req.body;

  const client = getGeminiClient();
  if (client) {
    try {
      const interestsStr = (interests || []).join(", ");
      const historyStr = (readingHistory || []).join(", ");
      const catalogOverview = db.books.map((b) => `'${b.title}' by ${b.author} in dept: ${b.department} (desc: ${b.description})`).join("\n");

      const prompt = `You are a DBATU Technical University Smart Library Advisor. 
Create expert technical reading recommendations for ${studentName || "the student"} who is studying in the ${branch || "Engineering"} Department.
Student Interests: ${interestsStr || "General Technology"}.
Read History: ${historyStr || "No books checked out yet"}.

Here is the current DBATU Central catalog overview:
${catalogOverview}

Recommend exactly 3 specific topics, books, or reading themes from our catalog that would match their profile. Give clear, inspirational engineering justifications.
Limit your total response to 200 words. Format as clean, visually pleasing markdown. Use specific DBATU student-friendly terms.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const recommendationMd = response.text || "No response text compiled.";
      return res.json({ personalizedRecommendations: recommendationMd, method: "AI System Model" });
    } catch (err: any) {
      console.error("[Gemini Error] Personalization service:", err);
      console.log("Personalization service offline (high public demand); activated DBATU campus fallback.");
      // Fallback to heuristic
    }
  }

  // Traditional Heuristic Recommendation System
  const matchedBooks = db.books.filter((b) => {
    const isBranchBook = branch ? b.department.toLowerCase().includes(branch.toLowerCase()) : false;
    const matchesInterest = (interests || []).some(
      (interest: string) => b.category.toLowerCase().includes(interest.toLowerCase()) || b.description.toLowerCase().includes(interest.toLowerCase())
    );
    return isBranchBook || matchesInterest;
  }).slice(0, 3);

  const matchedList = matchedBooks.length > 0 ? matchedBooks : db.books.slice(0, 3);
  let localMd = `### Personalized DBATU Central Recommendations (Engineering Core Advisor)\n\n`;
  matchedList.forEach((b) => {
    localMd += `- **${b.title}** (${b.author}) - *${b.category} / ${b.department}*\n`;
    localMd += `  *Recommendation Justification:* This matches your academic branch profile in ${branch || "Engineering"}. This is an essential reference on Rack at **${b.location}** with currently **${b.availableCopies}** copies left.\n\n`;
  });

  return res.json({ personalizedRecommendations: localMd, method: "DBATU Algorithmic Core" });
});

// 14. Generative Learning Roadmap Engine (Calls Gemini API or feeds expert defaults)
app.post("/api/roadmap/generate", async (req, res) => {
  const { skillQuery, studentId, studentName } = req.body;
  if (!skillQuery) {
    return res.status(400).json({ error: "Skill roadmap parameter target is null." });
  }

  logActivity(studentId || "u1", studentName || "Student", "student", "generate_roadmap", `Requested dynamic study roadmap generation for: '${skillQuery}'`);

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are a Senior Curriculum expert designing an advanced industrial learning roadmap for DBATU (Dr. Babasaheb Ambedkar Technological University) engineering students.
The student wants to study the following target domain or skill: "${skillQuery}".

Generate a complete, high-quality, practical learning roadmap divided into three stages: "Beginner", "Intermediate", and "Advanced".

You MUST respond strictly in valid JSON format. Do not wrap the JSON inside markdown triple backticks. It must be a raw parsable JSON.
The JSON Schema must match this TS interface:
interface RoadmapResponse {
  skillName: string;
  stages: {
    stageName: "Beginner" | "Intermediate" | "Advanced";
    description: string;
    topics: string[]; // List of specific sub-skills, libraries, core paradigms to master
    resources: {
      title: string;
      url: string;
      type: "Youtube Playlist" | "Official Documentation" | "Free Course" | "Article" | "Practice Platform" | "Website";
    }[];
    projects: string[]; // At least 2 practical tech projects ideas to build
  }[];
}

Ensure URLs are highly relevant reference domains like official sites, popular course registries, or developer platforms.
Provide comprehensive and detailed curriculum lists to help students ace technical job interviews.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const cleanJson = response.text?.trim() || "{}";
      const parsedRoadmap = JSON.parse(cleanJson);
      
      // Adapt generated output schema to exact internal Frontend schema (topics: { id: string, name: string, completed: boolean }[])
      const stagesAdapted = parsedRoadmap.stages.map((stage: any) => {
        return {
          stageName: stage.stageName,
          description: stage.description,
          topics: (stage.topics || []).map((tName: string, idx: number) => ({
            id: `topic_${stage.stageName.toLowerCase()}_${idx}`,
            name: tName,
            completed: false
          })),
          resources: stage.resources || [
            { title: "Official Documentation", url: "https://docs.microsoft.com", type: "Official Documentation" },
            { title: "GeeksforGeeks Practice Portal", url: "https://geeksforgeeks.org", type: "Practice Platform" }
          ],
          projects: stage.projects || ["Build an industrial prototype console app."]
        };
      });

      return res.json({
        id: "r_" + Date.now(),
        skillName: parsedRoadmap.skillName || skillQuery,
        stages: stagesAdapted
      });

    } catch (err: any) {
      console.error("[Gemini Error] Generative roadmap service:", err);
      console.log("Generative roadmap service offline (high public demand); activated expert fallback blueprint.");
    }
  }

  // Expert Backup Templates for Classic Skills (Python, Web Dev, ML...)
  let backupSkills: Record<string, string[]> = {
    python: ["Python Syntaxes & Variables", "Object Oriented OOP in Python", "Data Structures Lists/Dicts", "File Operations", "Pandas for Analytical Computations", "APIs construction with Flask/FastAPI", "Multithreading", "Algorithms with Python"],
    "web development": ["HTML5 semantic skeletons & layouts", "CSS3 Flexbox and responsive configurations", "Vanilla JavaScript & DOM manipulation", "React Hooks & Virtual DOM rendering", "Vite build setups", "Node.js Express API routings", "SQL database index tables", "REST endpoints security authentication"],
    "machine learning": ["Linear Algebra & Calculus metrics", "Pragmatic data wrangling via Scikit-Learn", "Feature engineering validations", "Supervised Classifications Models", "Deep learning Neural Network abstractions (TensorFlow)", "ML Model parameters tuning", "Deploying models via streamlit", "Automated pipelines MLOps"]
  };

  const cleanQuery = skillQuery.toLowerCase();
  let matchedSkillKey = Object.keys(backupSkills).find((sk) => cleanQuery.includes(sk)) || "python";
  let topicsList = backupSkills[matchedSkillKey];

  const backupRoadmap = {
    id: "r_backup_" + Date.now(),
    skillName: skillQuery,
    stages: [
      {
        stageName: "Beginner",
        description: "Master fundamentals, setup localized DBATU lab environments, and acquire basic vocabulary.",
        topics: [
          { id: "b_t1", name: topicsList[0], completed: false },
          { id: "b_t2", name: topicsList[1], completed: false },
          { id: "b_t3", name: topicsList[2], completed: false }
        ],
        resources: [
          { title: "Official Documentation Reference", url: "https://docs.python.org", type: "Official Documentation" },
          { title: "W3Schools Interactive Sandbox", url: "https://w3schools.com", type: "Website" }
        ],
        projects: ["Interactive console dashboard calculator", "Command line information directory finder"]
      },
      {
        stageName: "Intermediate",
        description: "Connect APIs, build robust file structures, and explore intermediate packages.",
        topics: [
          { id: "i_t1", name: topicsList[3], completed: false },
          { id: "i_t2", name: topicsList[4], completed: false },
          { id: "i_t3", name: topicsList[5], completed: false }
        ],
        resources: [
          { title: "Full Course Playlists on Youtube", url: "https://youtube.com", type: "Youtube Playlist" },
          { title: "FreeCodeCamp Complete Curriculum", url: "https://freecodecamp.org", type: "Free Course" }
        ],
        projects: ["Database connected student roster app", "Responsive API based forecast tracker"]
      },
      {
        stageName: "Advanced",
        description: "Deep dive into model parameters, production packaging, and optimization modules.",
        topics: [
          { id: "a_t1", name: topicsList[6], completed: false },
          { id: "a_t2", name: topicsList[7], completed: false }
        ],
        resources: [
          { title: "GitHub Engineering Repositories", url: "https://github.com", type: "Practice Platform" },
          { title: "Medium Medium Tech Articles", url: "https://medium.com", type: "Article" }
        ],
        projects: ["Full-Scale Campus Automated Library System", "Distributed ML model classification queue service"]
      }
    ]
  };

  return res.json(backupRoadmap);
});

// 15. Feedback: Log dynamic comments and feedback reports
app.post("/api/feedback", (req, res) => {
  const { studentId, studentName, rating, comment, category } = req.body;

  if (!studentName || !rating || !comment) {
    return res.status(400).json({ error: "Name, rating score, and feedback text required." });
  }

  const newFeedback = {
    id: "f_" + Date.now(),
    studentId: studentId || "anonymous",
    studentName,
    rating: Number(rating) || 5,
    comment,
    category: category || "General System",
    timestamp: new Date().toISOString()
  };

  db.feedbacks.unshift(newFeedback);
  saveDB();

  logActivity(studentId || "anonymous", studentName, "student", "submit_feedback", `Submitted formal feedback evaluation under Category of ${category} (${rating} Stars)`);

  return res.json({ success: true, feedback: newFeedback });
});

// 16. Feedback stats: Get all feedbacks for Admin review
app.get("/api/feedback", (req, res) => {
  return res.json(db.feedbacks);
});

// 17. Logs: Fetch logs for Audit Operations view (Admin Only)
app.get("/api/logs", (req, res) => {
  return res.json(db.logs);
});

// 18. System: Reset Database to Factory parameters (Admin Only)
app.post("/api/system/reset", (req, res) => {
  const { adminId, adminName } = req.body;
  
  db = {
    books: JSON.parse(JSON.stringify(DEFAULT_BOOKS)),
    users: DEFAULT_USERS.map(u => ({ ...u, password: hashPassword(u.password) })),
    issues: JSON.parse(JSON.stringify(DEFAULT_ISSUES)),
    feedbacks: JSON.parse(JSON.stringify(DEFAULT_FEEDBACKS)),
    logs: JSON.parse(JSON.stringify(DEFAULT_LOGS)),
    userRoadmaps: []
  };
  saveDB();

  logActivity(adminId || "admin", adminName || "Dr. S. R. Mahajan", "admin", "system_reset", "Librarian triggered Master Factory Database Reset. Reinitialized central DBATU records with secure pbkdf2 hashed credentials.");

  return res.json({ success: true });
});

// 19. System: Check Active Database Connectivity Status
app.get("/api/system/db-status", (req, res) => {
  return res.json({
    connected: isMongoDBConnected(),
    provider: isMongoDBConnected() ? "Atlas MongoDB" : "Local JSON Engine",
    connectionString: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 18)}...` : "None configured",
    lastError: getMongoLastError(),
    stats: {
      books: db.books.length,
      users: db.users.length,
      issues: db.issues.length,
      feedbacks: db.feedbacks.length,
      logs: db.logs.length,
      userRoadmaps: db.userRoadmaps.length
    }
  });
});

// 20. System: Manually Push & Sync All Core Datasets to MongoDB Atlas
app.post("/api/system/db-sync", async (req, res) => {
  const { adminId, adminName } = req.body;
  
  if (!isMongoDBConnected()) {
    // Attempt connecting on active request in case the configuration string was updated in settings
    const reconnected = await connectMongoDB();
    if (!reconnected) {
      return res.status(503).json({
        success: false,
        error: "MongoDB is not currently connected. Please configure your MONGODB_URI in Settings / Dev Environment before executing sync commands."
      });
    }
  }

  try {
    console.log("[MongoDB User Sync] Forcing deep push of all local states down to MongoDB cluster...");
    await syncToMongoDB(db);
    
    logActivity(
      adminId || "admin",
      adminName || "System Operator",
      "admin",
      "mongodb_sync",
      "Manually executed real-time dataset cluster synchronization, successfully mirror-writing local DB to MongoDB Atlas"
    );

    return res.json({
      success: true,
      message: "Data successfully pushed. Loaded dataset fully stored in MongoDB Atlas cluster."
    });
  } catch (error: any) {
    console.error("[MongoDB User Sync] Failed executing manually-triggered synchronization:", error);
    return res.status(500).json({
      success: false,
      error: `Sync failure: ${error?.message || error}`
    });
  }
});

// --- GOOGLE AI CO-PILOT ENDPOINTS (SUMMARY, EXAMS & NOTES GENERATION) ---

// Helper: fallback database generator for book summaries
function getBookSummaryFallback(title: string, author: string) {
  const normTitle = title.toLowerCase();
  
  if (normTitle.includes("algorithms")) {
    return {
      overview: "An essential syllabus textbook guiding structural analyses, sorting paradigms, and state machine complexations.",
      shortSummary: "Detailed exploration of algorithmic runtime complexities, divide-and-conquer methodologies, and graph traverse trees.",
      detailedSummary: "This textbook provides a deep, comprehensive review of computational algorithms. It establishes basic complexities (O-notation), advanced heap and binary partitions, red-black layout balancing, and custom flow-network max-min paths. Critical for DBATU tech-interviews.",
      learningObjectives: [
        "Acknowledge asymptotic bounds such as Theta, Big-O, and Big-Omega",
        "Implement master recurrence trees for divide-and-conquer paradigms",
        "Comprehend dynamic programming structures and greedy algorithms",
        "Perform advanced structural graph traversal (Dijkstra, Bellman-Ford, Kruskal)"
      ],
      keyTakeaways: [
        "Optimal sorting speeds are bounded by n log(n) on comparison scales",
        "Dynamic planning trades memory footprint to prevent duplicate computations",
        "NP-Completeness defines decision frameworks without known polynomial solvers"
      ],
      difficultyLevel: "Intermediate",
      readingDifficultyScore: 78,
      estimatedReadingTime: "14 Hours",
      recommendedSkillLevel: "Computer Science Sophomores",
      importantConcepts: [
        { name: "Asymptotic Analysis", description: "Evaluating computational growth scaling as a factor of inputs size." },
        { name: "Divide and Conquer", description: "Splitting difficult tasks into self-contained sub-units solved recursively." },
        { name: "Dynamic Programming", description: "Solving subproblems once and caching their states using tabulation/memoization." }
      ],
      importantChapters: [
        "Chapter 2: Getting Started (Insertion Sort / Merge Sort)",
        "Chapter 4: Divide-and-Conquer Recurrence relations",
        "Chapter 15: Dynamic Programming & Optimal BSTs",
        "Chapter 22: Elementary Graph Algorithms (BFS/DFS)"
      ],
      keywords: ["Complexity", "Dynamic Programming", "Recursion", "Heapsort", "Graphs", "NP-Complete"],
      learningOutcomes: [
        "Formulate algebraic equations modeling runtime complexity of custom blocks",
        "Formulate and implement robust sorting pathways optimized for distinct systems",
        "Represent and evaluate flow networks using augmenting paths"
      ]
    };
  } else if (normTitle.includes("database")) {
    return {
      overview: "Central curriculum textbook for understanding transactional safety, SQL operations, relational modeling, and secure database designs.",
      shortSummary: "Complete roadmap matching database layout techniques with industrial SQL database architectures.",
      detailedSummary: "The textbook covers the layout, querying, and underlying engine design of modern relational database management systems. It provides deep blueprints of entity-relationship representations, schema normalizations (1NF to BCNF, 4NF), ACID compliance, transaction logging (write-ahead log), and storage indices.",
      learningObjectives: [
        "Design robust Entity-Relationship (ER) schemas representing physical client workflows",
        "Normalize disorganized relations to eliminate insertion/deletion anomalies",
        "Execute advanced SQL queries using windowing functions, subqueries, and views",
        "Understand storage hierarchy indexing models like B+ Trees and Hash Tables"
      ],
      keyTakeaways: [
        "Normalization optimizes storage integrity at the cost of execution joins",
        "Transactions maintain ACID properties through lock strategies and journal logs",
        "NoSQL systems relax relational constraints to optimize high-performance linear scaling"
      ],
      difficultyLevel: "Intermediate",
      readingDifficultyScore: 68,
      estimatedReadingTime: "8 Hours",
      recommendedSkillLevel: "IT and computer engineering students",
      importantConcepts: [
        { name: "ACID Parameters", description: "Atomicity, Consistency, Isolation, and Durability - ensuring absolute transactional safety." },
        { name: "Database Normalization", description: "Decomposing schema mappings to guarantee redundancy-free records allocation." },
        { name: "B+ Tree Indexes", description: "Self-balancing search tree files supporting logarithmic lookup speeds." }
      ],
      importantChapters: [
        "Chapter 3: Introduction to Relational SQL",
        "Chapter 7: Relational Database Design & Normalization Rules",
        "Chapter 14: Transactions and Concurrency Lock Management",
        "Chapter 15: Indexing and Storage Hashing Structures"
      ],
      keywords: ["SQL", "Normalization", "BCNF", "ACID", "Concurrency Control", "Indexes", "B+ Trees"],
      learningOutcomes: [
        "Convert unstructured flat parameters into structured functional entity-relationship diagrams",
        "Draft sound production-ready queries resolving corporate analytical problems",
        "Configure proper database indexes based on querying patterns"
      ]
    };
  } else if (normTitle.includes("thermodynamics")) {
    return {
      overview: "Standard mechanical engineering reference outlining energy transformations, heat cycles, and thermodynamic entropy laws.",
      shortSummary: "Clear guide on thermal efficiency, properties of pure substances, and power cycle analyses.",
      detailedSummary: "Explains standard principles of energy balance across closed and open boundaries. Highlights the first and second laws of thermodynamics, entropy, exergy, Rankine power cycles, refrigeration systems, and mechanical gas cycles.",
      learningObjectives: [
        "Formulate steady-flow energy equations across control volumes (turbines, nozzles)",
        "Determine the performance efficiency of Rankine steam power stations",
        "Evaluate entropy changes across real irreversible systems",
        "Analyze gas power cycles including Otto, Diesel, and Brayton setups"
      ],
      keyTakeaways: [
        "Energy is strictly conserved but undergoes quality degradation according to entropy limits",
        "The Carnot cycle sets the maximum theoretical limits for thermal-to-work conversions",
        "Refrigerators act as reversed heat pumps requiring work inputs to move heat uphill"
      ],
      difficultyLevel: "Advanced",
      readingDifficultyScore: 84,
      estimatedReadingTime: "12 Hours",
      recommendedSkillLevel: "Mechanical & Thermal engineering sophomores",
      importantConcepts: [
        { name: "First Law of Thermodynamics", description: "Energy cannot be initiated or destroyed; it merely alters patterns." },
        { name: "Entropy Law (Second Law)", description: "Isolated system entropy always naturally trends upward, indicating irreversibility." },
        { name: "Exergy Analysis", description: "The maximum usable work potential of a system relative to its surrounding dead state." }
      ],
      importantChapters: [
        "Chapter 2: Energy, Energy Transfer, and General Analysis",
        "Chapter 5: Mass and Energy Analysis of Control Volumes",
        "Chapter 7: Entropy and Isentropic Processes",
        "Chapter 10: Vapor and Combined Power Cycles"
      ],
      keywords: ["Entropy", "Enthalpy", "Rankine Cycle", "Exergy", "Heat Engine", "Carnot", "Refrigeration"],
      learningOutcomes: [
        "Evaluate system states using thermodynamic steam property charts",
        "Design improved thermal power cycles maximizing industrial operational efficiency",
        "Predict maximum available power output of chemical/physical engines"
      ]
    };
  }

  // General Adaptive Fallback for other textbooks
  return {
    overview: `An essential syllabus companion for studying ${title} by ${author || "Expert Faculty"}.`,
    shortSummary: `Provides a unified structured overview of ${title} mapping key industrial concepts, core theories, and practical formulas.`,
    detailedSummary: `This textbook outlines intermediate to advanced concepts in the field. It serves as a cornerstone reference for Dr. Babasaheb Ambedkar Technological University (DBATU) course modules, introducing systematic design guidelines, critical testing theories, and engineering application frameworks.`,
    learningObjectives: [
      `Introduce primary theoretical foundations and models crucial to ${title}`,
      "Decompose industrial workflows into measurable execution phases",
      "Draft sound analytical formulas to solve real-world technical problems",
      "Understand standard optimization procedures matching modern industry protocols"
    ],
    keyTakeaways: [
      "Rigorous structural modeling saves prototyping costs during active projects",
      "System properties should align with global quality and compatibility standards",
      "Iterative validation is crucial to guarantee security and compliance under stress"
    ],
    difficultyLevel: "Intermediate",
    readingDifficultyScore: 72,
    estimatedReadingTime: "10 Hours",
    recommendedSkillLevel: "All Engineering Branches",
    importantConcepts: [
      { name: "Foundational Theories", description: "Core theoretical boundaries governing the analytical modeling." },
      { name: "Implementation Schema", description: "Practical application framework matching theoretical patterns to structural outputs." },
      { name: "System Optimization", description: "Procedures mapped to enhance efficiencies and reduce system waste." }
    ],
    importantChapters: [
      "Chapter 1: Foundational Framework and Introduction",
      "Chapter 3: Core Analytical Methods",
      "Chapter 5: Design Optimization Strategies",
      "Chapter 8: Safety, Quality, and Compliance Systems"
    ],
    keywords: ["Engineering", "Syllabus Prep", "Methodology", "Optimization", "Design", "Database"],
    learningOutcomes: [
      "Map basic system specifications to structured design workflows",
      "Acknowledge the role of core variables in system balancing",
      "Apply localized optimizations to maximize throughput efficiency"
    ]
  };
}

// Fallback database generator for book exam notes
function getBookExamNotesFallback(title: string, author: string) {
  const normTitle = title.toLowerCase();

  let units = [
    {
      unitNumber: 1,
      title: "Foundations & Structural Systems",
      summary: "Introduces basic boundaries, elementary nomenclature and core thermodynamic properties.",
      definitions: [
        { term: "Asymptotic Upper Bound (O)", definition: "Mathematical mapping tool that expresses system computational limits as input limits go to infinity.", isImportant: true },
        { term: "Isentropic State", definition: "A physical constant system where entropy is maintained. Reversible adiabatic process.", isImportant: false }
      ],
      formulas: [
        { name: "Master Theorem Equation", equation: "T(n) = a T(n/b) + f(n)", explanation: "Standard solver for recurrence relations representing divide-and-conquer runtime layouts.", useCase: "Recursive tree analysis" }
      ],
      importantConcepts: [
        "asymptotic efficiency evaluation",
        "State variables vs Path variables selection",
        "Recursive call stack overhead limits"
      ],
      likelyQuestions: [
        { question: "State and prove the correctness criteria of Merge Sort along with recursive time computation.", marks: 10, suggestedAnswerOutline: "1. Divide-and-conquer logic flow. 2. Recursion recurrence formula: T(n) = 2T(n/2) + O(n). 3. Apply master theorem or recursive tree to solve to O(n log n). 4. Detail merge validation logic step-by-step." },
        { question: "Differentiate between Big-O and Theta notations with illustrative graphs.", marks: 5, suggestedAnswerOutline: "Big-O defines absolute ceiling bounds (upper limits), while Theta defines tight bounds (both upper and lower limits). Provide coordinate charting plots." }
      ]
    },
    {
      unitNumber: 2,
      title: "Advanced Core Systems & Optimization",
      summary: "Deconstructs optimized structures, layout indexing formulas, and transactional limits.",
      definitions: [
        { term: "ACID Atomicity", definition: "Transaction safety rule stating that all operations within a packet must succeed fully or rollback entirely.", isImportant: true },
        { term: "Rankine Vapor Loop", definition: "Four-element power station loop comprising pump, boiler, turbine, and heat condenser.", isImportant: true }
      ],
      formulas: [
        { name: "Rankine Station Efficiency", equation: "Efficiency = (Work_turbine - Work_pump) / Q_in", explanation: "Calculates the percentage of input energy converted into usable work outputs.", useCase: "Power station design calculations" }
      ],
      importantConcepts: [
        "BCNF schema normalization validations",
        "Steam performance quality tables",
        "Graph Minimum Spanning Trees"
      ],
      likelyQuestions: [
        { question: "Explain B+ Tree index structures and detail insertion splits logic inside database engines.", marks: 10, suggestedAnswerOutline: "Explain branching pointer design. Contrast B+ Tree with standard B-Tree (data solely stored in leaf nodes). Detail root allocation and leaf pointer linking. Show an example of splitting a 3-pointer terminal node." },
        { question: "Define entropy and explain Clausius inequality proof representing system waste.", marks: 5, suggestedAnswerOutline: "Define entropy as heat/temperature relative scaling (dS = dQ/T). Write down inequality: Integral of dQ/T is less than or equal to zero for cyclic operations." }
      ]
    }
  ];

  let revisionMode = {
    criticalConcepts: [
      "ACID concurrency control locks",
      "Asymptotic upper & tight bounds comparison",
      "First and Second laws governing energy transforms"
    ],
    criticalDefinitions: [
      { term: "Big-O Notation", definition: "Worst-case execution limit marker." },
      { term: "BCNF", definition: "Normal form eliminating multivariate anomalies." }
    ],
    criticalFormulas: [
      { formula: "T(n) = a*T(n/b) + f(n)", useCase: "Runtime recurrence sorting analysis" },
      { formula: "Efficiency = 1 - T_low/T_high", useCase: "Max Carnot cycle boundaries" }
    ],
    expectedQuestions: [
      "Differentiate 3NF and BCNF schemas referencing dependency preservation.",
      "Explain Dijkstra Shortest Path dynamic weights flow layout.",
      "Analyze reheat power loops to improve Rankine efficiencies."
    ],
    examTips: [
      "Always sketch structural figures (Index trees, Rankine flow charts, Recurrence tree divisions) for full marks in DBATU long sheets.",
      "Write units clearly for formulas calculations to prevent minor grade cuts.",
      "Divide 10-mark questions into Abstract, Core Body, Schema plots, and Conclusion."
    ]
  };

  let flashcards = [
    { id: "flash_1", front: "What is BCNF?", back: "Boyce-Codd Normal Form: Any non-trivial functional dependency X -> Y requires X to be a super key.", category: "Databases" },
    { id: "flash_2", front: "What is the complexity of Merge Sort?", back: "O(n log n) in all worst, best, and average cases due to consistent recurrences.", category: "Algorithms" },
    { id: "flash_3", front: "What is the Second Law of Thermodynamics?", back: "System entropy always increases, meaning total exergy will always experience some degradation.", category: "Mechanical" },
    { id: "flash_4", front: "What is reference integrity?", back: "Constraints ensuring foreign keys point accurately to valid tables entries in the DB.", category: "Databases" }
  ];

  if (normTitle.includes("algorithms")) {
    // Already populated algorithms topics
  } else if (normTitle.includes("database")) {
    units[0].title = "Relational Model & Design Schema";
    units[0].definitions = [
      { term: "Primary Key", definition: "A minimal set of attributes that uniquely identifies an entry in a relational table.", isImportant: true },
      { term: "Functional Dependency", definition: "A constraint between two sets of attributes in a relation.", isImportant: true }
    ];
    units[0].formulas = [
      { name: "Relational Algebra Selection", equation: "sigma_cond (Relation)", explanation: "Filters rows matching the given logic criteria.", useCase: "Query planning optimization" }
    ];
    units[1].title = "Transactions and Indexing Control";
  }

  return { units, revisionMode, flashcards };
}

// 1. POST API: ChatGPT Interactive Assistant Copilot
app.post("/api/copilot/chat", async (req, res) => {
  const { prompt: userPrompt, context, chatHistory } = req.body;
  if (!userPrompt) {
    return res.status(400).json({ error: "Empty user query." });
  }

  const client = getGeminiClient();
  if (client) {
    try {
      let promptText = `You are "AI Academic Copilot", an elite Technical Advisor at DBATU (Dr. Babasaheb Ambedkar Technological University).
You are helping engineering students master their textbooks, exam notes, and career skill pathways.

Context about current active study materials:
${JSON.stringify(context || {})}

Previous conversation history:
${(chatHistory || []).map((h: any) => `${h.role === "user" ? "Student" : "Copilot"}: ${h.text}`).join("\n")}

Respond to the student's query thoughtfully, with engineering-level precision, providing specific examples, clear formulas or pseudocode where appropriate. Keep it encouraging, clean, and styled in standard easy-to-read Markdown. Use DBATU syllabi references where logical.

Student's Query: "${userPrompt}"`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText
      });

      return res.json({ text: response.text || "No response generated by Copilot model." });
    } catch (err: any) {
      console.error("[Gemini Error] Copilot chat:", err);
      console.log("Copilot chat Gemini call offline, using fallback heuristics...");
    }
  }

  // Intuitive heuristics chatbot fallback
  const lowerPrompt = userPrompt.toLowerCase();
  let text = "I am your DBATU AI Academic Assistant. My core generative models are currently busy, but here is an engineering overview:\n\n";
  
  if (lowerPrompt.includes("summarize") || lowerPrompt.includes("unit 3") || lowerPrompt.includes("chapter")) {
    text += "### 📌 Core Revision Breakdown\n" +
            "In this component, focus heavily on:\n" +
            "1. **Core Structural Formulae**: Ensure you verify input boundary ratios.\n" +
            "2. **Standard Derivations**: Memorize isentropic relations or execution trees.\n" +
            "3. **Mock Exam Questions**: Practice 5-mark differences sheets. Keep definitions word-perfect.";
  } else if (lowerPrompt.includes("viva") || lowerPrompt.includes("questions") || lowerPrompt.includes("interview")) {
    text += "### 🎙️ Key DBATU Laboratory Viva Questions Practice\n" +
            "- **Q1**: Explain ACID vs Base state models in high performance scales.\n" +
            "- **Q2**: Why are B+ Trees preferred over regular binary trees in physical disk memory? (A: Logarithmic storage page read alignments).\n" +
            "- **Q3**: Contrast steady state exergy calculations against entropy gains.";
  } else if (lowerPrompt.includes("formula") || lowerPrompt.includes("equations")) {
    text += "### 📐 Exam-Crucial Formulas Sheet\n" +
            "- **Master Recursive Theorem**: `T(n) = a*T(n/b) + f(n)` to evaluate standard sorting complexities.\n" +
            "- **Carnot Max Thermodynamic Limit**: `η = 1 - T_C / T_H` where temperatures must match absolute Kelvin indicators.";
  } else {
    text += `Thank you for asking about "${userPrompt}". Focus on reading your syllabus guidelines and tracking structural milestones. I'm here to analyze your books, generate custom exam-ready flashcards, and guide your skill checkpoints! Let me know if you would like me to generate viva questions or explain formulas.`;
  }

  return res.json({ text });
});

// 2. POST API: Get/Generate AI Book Summary
app.post("/api/book/summary", async (req, res) => {
  const { bookTitle, author } = req.body;
  if (!bookTitle) {
    return res.status(400).json({ error: "Book title parameter is null." });
  }

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are an elite academic curriculum reviewer. 
Generate a comprehensive, high-quality, practical AI Summary and outline for the textbook titled "${bookTitle}" by "${author || "Expert Faculty"}".

You MUST respond strictly in valid JSON format. Do not wrap the JSON inside markdown triple backticks. It must be raw parsable JSON.
The JSON must follow this exact schema:
{
  "overview": "A short 1-sentence tagline describing the book's core mechanical or computer science purpose.",
  "shortSummary": "A concise paragraph summary.",
  "detailedSummary": "A robust 3-4 sentence detailed review explaining normalizations, algorithms, cycles, or designs.",
  "learningObjectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "difficultyLevel": "Beginner" | "Intermediate" | "Advanced" | "Expert",
  "readingDifficultyScore": 75, // integer 1-100 indicating depth
  "estimatedReadingTime": "12 Hours", // text string
  "recommendedSkillLevel": "e.g. Sophomores, Seniors",
  "importantConcepts": [
    { "name": "Concept name", "description": "1-sentence description" }
  ],
  "importantChapters": ["Chapter 1: title", "Chapter 2: title"],
  "keywords": ["word1", "word2"],
  "learningOutcomes": ["outcome 1", "outcome 2"]
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error(`[Gemini Error] Summary generation for '${bookTitle}':`, err);
      console.log(`Failed invoking Gemini for summary of ${bookTitle}, loading fallback...`);
    }
  }

  // Load heuristic fallback
  const fallback = getBookSummaryFallback(bookTitle, author);
  return res.json(fallback);
});

// 3. POST API: Get/Generate Full Exam Ready Notes Breakdown
app.post("/api/book/exam-notes", async (req, res) => {
  const { bookTitle, author } = req.body;
  if (!bookTitle) {
    return res.status(400).json({ error: "Book title parameter is null." });
  }

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are a Senior Engineering Academic Registrar at Dr. Babasaheb Ambedkar Technological University (DBATU).
Generate exam-ready, comprehensive revision notes for the textbook titled "${bookTitle}" by "${author || "Expert"}".

You MUST respond strictly in valid JSON format. Do not wrap the JSON inside markdown triple backticks. It must be raw parsable JSON.
The JSON must follow this exact schema:
{
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit Name",
      "summary": "Brief 2-sentence curriculum summary",
      "definitions": [
        { "term": "Term Name", "definition": "Academic definition", "isImportant": true }
      ],
      "formulas": [
        { "name": "Formula Name", "equation": "W = F * d", "explanation": "Variables description", "useCase": "What it calculates" }
      ],
      "importantConcepts": ["concept 1", "concept 2"],
      "likelyQuestions": [
        { "question": "The exam question?", "marks": 10, "suggestedAnswerOutline": "Step-by-step guideline response" }
      ]
    }
  ],
  "revisionMode": {
    "criticalConcepts": ["concept 1", "concept 2"],
    "criticalDefinitions": [
      { "term": "Term", "definition": "Short revision definition" }
    ],
    "criticalFormulas": [
      { "formula": "Formula", "useCase": "What it calculates" }
    ],
    "expectedQuestions": ["Question a", "Question b"],
    "examTips": ["Tip 1", "Tip 2"]
  },
  "flashcards": [
    { "id": "fc1", "front": "Short question style", "back": "Direct answer", "category": "Topic Category" }
  ]
}

Ensure the definitions, formulas, and mock questions are extremely detailed and technical, perfectly mapping the standard engineering course limits.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error(`[Gemini Error] Exam notes generation for '${bookTitle}':`, err);
      console.log(`Failed invoking Gemini for exam notes of ${bookTitle}, loading fallback...`);
    }
  }

  // Load heuristic fallback
  const fallback = getBookExamNotesFallback(bookTitle, author);
  return res.json(fallback);
});

// ---------------- VITE MIDDLEWARE CONFIG ----------------
// Serve compilation bundles dynamically based on node env
async function initServer() {
  // Populate or seed DB records from connected streams (MongoDB or file system) before listening
  await loadDB();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[DBATU Smart Server Core] System operational.`);
      console.log(`[DBATU Smart Server Core] Bound on http://0.0.0.0:${PORT}`);
    });
  } else {
    console.log(`[Vercel Serverless] Delegating router handler to Vercel.`);
  }
}

initServer();

export default app;
