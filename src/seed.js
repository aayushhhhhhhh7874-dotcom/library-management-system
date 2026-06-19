const dotenv = require("dotenv");
const connectDB = require("./config/database");
const Book = require("./models/Book");
const BorrowRecord = require("./models/BorrowRecord");
const Category = require("./models/Category");
const Notification = require("./models/Notification");
const User = require("./models/User");
const {
  BORROW_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  ROLES
} = require("./constants/roles");

dotenv.config();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const seed = async () => {
  await connectDB();

  await Promise.all([
    BorrowRecord.deleteMany(),
    Notification.deleteMany(),
    Book.deleteMany(),
    Category.deleteMany(),
    User.deleteMany()
  ]);

  const [fiction, technology, business] = await Category.create([
    {
      name: "Fiction",
      description: "Novels, classics, and story-driven books."
    },
    {
      name: "Technology",
      description: "Programming, software engineering, and computer science."
    },
    {
      name: "Business",
      description: "Management, entrepreneurship, and professional growth."
    }
  ]);

  const [librarian, member, overdueMember] = await User.create([
    {
      name: "Admin Librarian",
      email: "librarian@example.com",
      password: "Password@123",
      role: ROLES.LIBRARIAN
    },
    {
      name: "Ayush Member",
      email: "member@example.com",
      password: "Password@123",
      role: ROLES.MEMBER,
      phone: "9876543210",
      membershipStatus: MEMBERSHIP_STATUS.ACTIVE
    },
    {
      name: "Late Return Member",
      email: "late@example.com",
      password: "Password@123",
      role: ROLES.MEMBER,
      membershipStatus: MEMBERSHIP_STATUS.ACTIVE
    }
  ]);

  const [cleanCode, alchemist, startup] = await Book.create([
    {
      title: "Clean Code",
      isbn: "9780132350884",
      author: "Robert C. Martin",
      category: technology._id,
      publisher: "Pearson",
      publishedYear: 2008,
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: "T-01"
    },
    {
      title: "The Alchemist",
      isbn: "9780061122415",
      author: "Paulo Coelho",
      category: fiction._id,
      publisher: "HarperOne",
      publishedYear: 1988,
      totalCopies: 5,
      availableCopies: 5,
      shelfLocation: "F-07"
    },
    {
      title: "The Lean Startup",
      isbn: "9780307887894",
      author: "Eric Ries",
      category: business._id,
      publisher: "Crown Currency",
      publishedYear: 2011,
      totalCopies: 3,
      availableCopies: 2,
      shelfLocation: "B-03"
    }
  ]);

  const [activeRecord, overdueRecord] = await BorrowRecord.create([
    {
      member: member._id,
      book: cleanCode._id,
      issuedBy: librarian._id,
      dueDate: daysFromNow(7),
      status: BORROW_STATUS.BORROWED
    },
    {
      member: overdueMember._id,
      book: startup._id,
      issuedBy: librarian._id,
      dueDate: daysFromNow(-3),
      status: BORROW_STATUS.OVERDUE
    }
  ]);

  await Notification.create([
    {
      user: member._id,
      type: NOTIFICATION_TYPES.BORROW_CONFIRMATION,
      title: "Book borrowed",
      message: `You borrowed "${cleanCode.title}".`,
      relatedBorrowRecord: activeRecord._id,
      dueDate: activeRecord.dueDate
    },
    {
      user: overdueMember._id,
      type: NOTIFICATION_TYPES.OVERDUE_ALERT,
      title: "Book overdue",
      message: `The book "${startup.title}" is overdue.`,
      relatedBorrowRecord: overdueRecord._id,
      dueDate: overdueRecord.dueDate
    }
  ]);

  console.log("Database seeded successfully.");
  console.log("Librarian login: librarian@example.com / Password@123");
  console.log("Member login: member@example.com / Password@123");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
