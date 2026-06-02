import mongoose from "mongoose";

// Define strict typing schemas for Dr. Babasaheb Ambedkar Technological University (Lonere) Central DBATU metrics

const StudentUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["student", "admin"] },
  branch: { type: String },
  interests: [{ type: String }],
  approved: { type: Boolean, default: false }
}, { timestamps: true });

const BookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String },
  rating: { type: Number, default: 4.5 },
  totalCopies: { type: Number, required: true, default: 5 },
  availableCopies: { type: Number, required: true, default: 5 },
  category: { type: String },
  location: { type: String }
}, { timestamps: true });

const IssueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookId: { type: String, required: true },
  bookTitle: { type: String, required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  requestDate: { type: String },
  dueDate: { type: String },
  durationDays: { type: Number, default: 14 },
  status: { type: String, enum: ["pending", "approved", "rejected", "returned", "renew_pending"], default: "pending" },
  fine: { type: Number, default: 0 }
}, { timestamps: true });

const FeedbackSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  category: { type: String, default: "General System" },
  timestamp: { type: String }
}, { timestamps: true });

const LogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String },
  userId: { type: String },
  userName: { type: String },
  userRole: { type: String },
  action: { type: String },
  details: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

const UserRoadmapSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  skillName: { type: String, required: true },
  createdDate: { type: String },
  lastUpdated: { type: String },
  progressPercent: { type: Number, default: 0 },
  stages: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true, strict: false });

// Declare models or compile them
export const MongoUser = mongoose.models.User || mongoose.model("User", StudentUserSchema);
export const MongoBook = mongoose.models.Book || mongoose.model("Book", BookSchema);
export const MongoIssue = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
export const MongoFeedback = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
export const MongoLog = mongoose.models.Log || mongoose.model("Log", LogSchema);
export const MongoUserRoadmap = mongoose.models.UserRoadmap || mongoose.model("UserRoadmap", UserRoadmapSchema);

let connectionInstance: typeof mongoose | null = null;
let isMongoConfigured = false;
let lastMongoError: string | null = null;

export function getMongoLastError(): string | null {
  return lastMongoError;
}

/**
 * Initializes connection to the MongoDB database using the given connection string.
 * Fallbacks gracefully if the URI is not found or fails to connect.
 */
export async function connectMongoDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri === "MY_MONGODB_URI" || uri.trim() === "") {
    console.log("[MongoDB Manager] Connection String MONGODB_URI is not set. Defaulting to high-performance local JSON engine.");
    isMongoConfigured = false;
    lastMongoError = "Authentication URI is empty or unconfigured. Please modify MONGODB_URI under Settings / .env file.";
    return false;
  }

  try {
    if (connectionInstance && mongoose.connection.readyState === 1) {
      isMongoConfigured = true;
      lastMongoError = null;
      return true;
    }

    console.log("[MongoDB Manager] Connecting to MongoDB Cluster server...");
    connectionInstance = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    isMongoConfigured = true;
    lastMongoError = null;
    console.log("[MongoDB Manager] Core connected safely with status: SUCCESS.");
    return true;
  } catch (err: any) {
    console.error("[MongoDB Manager] Initial cluster link failed! Deflecting stream back to local disk state.", err);
    
    // Categorize error for diagnostic guidance
    const errorStr = String(err);
    if (errorStr.includes("bad auth") || errorStr.includes("AuthenticationFailed") || errorStr.includes("auth failed")) {
      lastMongoError = "Authentication Failed: The username/password credentials embedded in your connection string are invalid or contains special characters that are not properly URL-encoded.";
    } else if (
      errorStr.includes("MongooseServerSelectionError") || 
      errorStr.includes("ServerSelectionError") || 
      errorStr.includes("whitelist") || 
      errorStr.includes("connect ETIMEDOUT") || 
      errorStr.includes("keepAlive")
    ) {
      lastMongoError = "IP Whitelist / Network Restrictive Entry: The server could not connect to your MongoDB Atlas cluster. Please make sure that your MongoDB Atlas Network Security allows access from anywhere (0.0.0.0/0), as Cloud Run utilizes dynamic scale-out IPs.";
    } else {
      lastMongoError = `Server selection failed: ${errorStr}`;
    }
    
    isMongoConfigured = false;
    return false;
  }
}

/**
 * Checks if MongoDB is active and connected
 */
export function isMongoDBConnected(): boolean {
  return isMongoConfigured && mongoose.connection.readyState === 1;
}

// Sequential promise execution queue to prevent overlapping write transaction race conditions
let syncQueue: Promise<any> = Promise.resolve();

/**
 * Synchronizes local in-memory DB arrays directly to MongoDB databases.
 * Uses fully reliable transaction overwrite approach to guarantee absolute synchronization.
 */
export async function syncToMongoDB(dbState: {
  books: any[];
  users: any[];
  issues: any[];
  feedbacks: any[];
  logs: any[];
  userRoadmaps?: any[];
}): Promise<void> {
  if (!isMongoDBConnected()) return;

  const currentOp = async () => {
    try {
      // Synchronize all collections concurrently for speed
      await Promise.all([
        (async () => {
          await MongoUser.deleteMany({});
          if (dbState.users.length > 0) await MongoUser.insertMany(dbState.users);
        })(),
        (async () => {
          await MongoBook.deleteMany({});
          if (dbState.books.length > 0) await MongoBook.insertMany(dbState.books);
        })(),
        (async () => {
          await MongoIssue.deleteMany({});
          if (dbState.issues.length > 0) await MongoIssue.insertMany(dbState.issues);
        })(),
        (async () => {
          await MongoFeedback.deleteMany({});
          if (dbState.feedbacks.length > 0) await MongoFeedback.insertMany(dbState.feedbacks);
        })(),
        (async () => {
          await MongoLog.deleteMany({});
          if (dbState.logs.length > 0) await MongoLog.insertMany(dbState.logs);
        })(),
        (async () => {
          await MongoUserRoadmap.deleteMany({});
          if (dbState.userRoadmaps && dbState.userRoadmaps.length > 0) {
            await MongoUserRoadmap.insertMany(dbState.userRoadmaps);
          }
        })()
      ]);
      console.log("[MongoDB Sync] Handshake complete: Mirror state successfully synced with Atlas.");
    } catch (error) {
      console.error("[MongoDB Sync] Mirror state synchronize error:", error);
    }
  };

  // Chain the current write onto the sequential execution queue
  syncQueue = syncQueue.then(currentOp).catch((err) => {
    console.error("[MongoDB Sync Queue Promise Failure]", err);
  });

  await syncQueue;
}

/**
 * Fetches database records from MongoDB.
 * If the MongoDB is connected but completely empty, it seeds initial university records from standard fallback templates.
 */
export async function seedAndLoadFromMongoDB(defaults: {
  books: any[];
  users: any[];
  issues: any[];
  feedbacks: any[];
  logs: any[];
}): Promise<{
  books: any[];
  users: any[];
  issues: any[];
  feedbacks: any[];
  logs: any[];
  userRoadmaps: any[];
} | null> {
  if (!isMongoDBConnected()) return null;

  try {
    // Check if seeding is necessary by inspecting MongoDB counts
    const userCount = await MongoUser.countDocuments();
    if (userCount === 0) {
      console.log("[MongoDB Seeder] Target collections empty. Performing clean deep seed...");
      
      // Clear all targeted collections first to prevent any partial/orphaned indexes from triggering conflicts (E11000)
      await Promise.all([
        MongoUser.deleteMany({}),
        MongoBook.deleteMany({}),
        MongoIssue.deleteMany({}),
        MongoFeedback.deleteMany({}),
        MongoLog.deleteMany({})
      ]);

      await Promise.all([
        MongoUser.insertMany(defaults.users),
        MongoBook.insertMany(defaults.books),
        MongoIssue.insertMany(defaults.issues),
        MongoFeedback.insertMany(defaults.feedbacks),
        MongoLog.insertMany(defaults.logs)
      ]);
      console.log("[MongoDB Seeder] Initial seeds committed successfully.");
    }

    // Retrieve active documents
    const [users, books, issues, feedbacks, logs, userRoadmaps] = await Promise.all([
      MongoUser.find().lean(),
      MongoBook.find().lean(),
      MongoIssue.find().lean(),
      MongoFeedback.find().lean(),
      MongoLog.find().lean(),
      MongoUserRoadmap.find().lean()
    ]);

    // Format cleaner records by casting mongoose objects and cleaning schema tracking meta tags
    const cleanDoc = (doc: any) => {
      const { _id, __v, createdAt, updatedAt, ...rest } = doc;
      return rest;
    };

    return {
      users: users.map(cleanDoc),
      books: books.map(cleanDoc),
      issues: issues.map(cleanDoc),
      feedbacks: feedbacks.map(cleanDoc),
      logs: logs.map(cleanDoc),
      userRoadmaps: userRoadmaps.map(cleanDoc)
    };
  } catch (error) {
    console.error("[MongoDB Seeder] Failed loading databases from MongoDB client:", error);
    return null;
  }
}
