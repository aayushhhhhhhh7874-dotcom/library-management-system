const dotenv = require("dotenv");
const mongoose = require("mongoose");
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
const {
  CSE_SUBJECTS,
  buildCseBookCatalog
} = require("./data/cseBookCatalog");

dotenv.config();

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const resetDatabase = async () => {
  await Promise.all([
    BorrowRecord.deleteMany(),
    Notification.deleteMany(),
    Book.deleteMany(),
    Category.deleteMany(),
    User.deleteMany()
  ]);
};

const createCategories = async () => {
  const categories = await Category.insertMany(CSE_SUBJECTS.map((subject) => ({
    name: subject.name,
    description: `${subject.code}, semester ${subject.semester}: ${subject.keywords.join(", ")}.`
  })));

  return new Map(categories.map((category) => [category.name, category._id]));
};

const createUsers = async () => User.create([
  {
    name: "Aayush Kumar",
    email: "aayush.kr0804@gmail.com",
    password: "Password@123",
    role: ROLES.LIBRARIAN,
    phone: "9876500001",
    department: "Central Library"
  },
  {
    name: "Ayush Kumar",
    email: "member@example.com",
    password: "Password@123",
    role: ROLES.MEMBER,
    phone: "9876543210",
    studentId: "CSE2026001",
    semester: 5,
    enrollmentYear: 2024,
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE
  },
  {
    name: "Riya Singh",
    email: "late@example.com",
    password: "Password@123",
    role: ROLES.MEMBER,
    phone: "9876543211",
    studentId: "CSE2026002",
    semester: 6,
    enrollmentYear: 2023,
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE
  },
  {
    name: "Kabir Mehta",
    email: "kabir@example.com",
    password: "Password@123",
    role: ROLES.MEMBER,
    phone: "9876543212",
    studentId: "CSE2026003",
    semester: 3,
    enrollmentYear: 2025,
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE
  },
  {
    name: "Sara Khan",
    email: "sara@example.com",
    password: "Password@123",
    role: ROLES.MEMBER,
    phone: "9876543213",
    studentId: "CSE2026004",
    semester: 7,
    enrollmentYear: 2023,
    membershipStatus: MEMBERSHIP_STATUS.ACTIVE
  }
]);

const createBooks = async (categoryIds) => {
  const books = buildCseBookCatalog().map(({ categoryName, ...book }) => ({
    ...book,
    category: categoryIds.get(categoryName)
  }));

  return Book.insertMany(books);
};

const createActivity = async (users, books) => {
  const [librarian, member, overdueMember, kabir, sara] = users;
  const activeBook = books[8];
  const overdueBook = books[492];
  const returnedBook = books[760];
  const secondActiveBook = books[245];

  activeBook.availableCopies -= 1;
  overdueBook.availableCopies -= 1;
  secondActiveBook.availableCopies -= 1;
  await Promise.all([
    activeBook.save({ validateModifiedOnly: true }),
    overdueBook.save({ validateModifiedOnly: true }),
    secondActiveBook.save({ validateModifiedOnly: true })
  ]);

  const [activeRecord, overdueRecord, returnedRecord, secondActiveRecord] = await BorrowRecord.create([
    {
      member: member._id,
      book: activeBook._id,
      issuedBy: librarian._id,
      dueDate: daysFromNow(7),
      status: BORROW_STATUS.BORROWED
    },
    {
      member: overdueMember._id,
      book: overdueBook._id,
      issuedBy: librarian._id,
      dueDate: daysFromNow(-4),
      status: BORROW_STATUS.OVERDUE
    },
    {
      member: kabir._id,
      book: returnedBook._id,
      issuedBy: librarian._id,
      returnedTo: librarian._id,
      dueDate: daysFromNow(-10),
      returnDate: daysFromNow(-12),
      status: BORROW_STATUS.RETURNED,
      fine: 0
    },
    {
      member: sara._id,
      book: secondActiveBook._id,
      issuedBy: librarian._id,
      dueDate: daysFromNow(11),
      status: BORROW_STATUS.BORROWED
    }
  ]);

  await Notification.create([
    {
      user: member._id,
      type: NOTIFICATION_TYPES.BORROW_CONFIRMATION,
      title: "Book borrowed",
      message: `You borrowed "${activeBook.title}".`,
      relatedBorrowRecord: activeRecord._id,
      dueDate: activeRecord.dueDate
    },
    {
      user: overdueMember._id,
      type: NOTIFICATION_TYPES.OVERDUE_ALERT,
      title: "Book overdue",
      message: `The book "${overdueBook.title}" is overdue.`,
      relatedBorrowRecord: overdueRecord._id,
      dueDate: overdueRecord.dueDate
    },
    {
      user: kabir._id,
      type: NOTIFICATION_TYPES.RETURN_CONFIRMATION,
      title: "Book returned",
      message: `You returned "${returnedBook.title}".`,
      relatedBorrowRecord: returnedRecord._id
    },
    {
      user: sara._id,
      type: NOTIFICATION_TYPES.BORROW_CONFIRMATION,
      title: "Book borrowed",
      message: `You borrowed "${secondActiveBook.title}".`,
      relatedBorrowRecord: secondActiveRecord._id,
      dueDate: secondActiveRecord.dueDate
    }
  ]);
};

const seed = async () => {
  await connectDB();
  await resetDatabase();

  const categoryIds = await createCategories();
  const users = await createUsers();
  const books = await createBooks(categoryIds);
  await createActivity(users, books);

  console.log(`Database seeded with ${categoryIds.size} categories and ${books.length} BTech CSE books.`);
  console.log("Librarian: aayush.kr0804@gmail.com / Password@123");
  console.log("Member: member@example.com / Password@123");
  console.log("Overdue member: late@example.com / Password@123");
};

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  });
