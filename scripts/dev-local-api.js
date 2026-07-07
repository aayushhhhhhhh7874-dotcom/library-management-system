const crypto = require("node:crypto");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const { CSE_SUBJECTS, buildCseBookCatalog } = require("../src/data/cseBookCatalog");

const projectRoot = path.resolve(__dirname, "..");
const frontendRoot = path.join(projectRoot, "frontend");
const dataDir = path.join(projectRoot, "data");
const dbPath = path.join(dataDir, "local-library-db.json");
const port = Number(process.env.PORT || 5000);
const tokenSecret = process.env.LOCAL_API_SECRET || "stack-shelf-local-dev-secret";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
};

let dbCache = null;

const now = () => new Date().toISOString();
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const base64url = (value) => Buffer.from(value).toString("base64url");

const sign = (value) => crypto
  .createHmac("sha256", tokenSecret)
  .update(value)
  .digest("base64url");

const createToken = (userId) => {
  const payload = base64url(JSON.stringify({ userId, issuedAt: Date.now() }));
  return `${payload}.${sign(payload)}`;
};

const readToken = (authorization = "") => {
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const [payload, signature] = token.split(".");

  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
};

const verifyPassword = (password, user) => {
  const nextHash = hashPassword(password, user.passwordSalt).hash;
  return crypto.timingSafeEqual(Buffer.from(nextHash, "hex"), Buffer.from(user.passwordHash, "hex"));
};

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
};

const createUser = (payload) => {
  const password = hashPassword(payload.password || "Password@123");
  const createdAt = payload.createdAt || now();

  return {
    _id: payload._id || createId("user"),
    name: payload.name,
    email: String(payload.email).toLowerCase(),
    passwordHash: password.hash,
    passwordSalt: password.salt,
    role: payload.role || "member",
    phone: payload.phone || "",
    address: payload.address || "",
    studentId: payload.studentId ? String(payload.studentId).toUpperCase() : "",
    department: payload.department || "Computer Science and Engineering",
    semester: Number(payload.semester || 1),
    enrollmentYear: Number(payload.enrollmentYear || new Date().getFullYear()),
    membershipStatus: payload.membershipStatus || "active",
    borrowLimit: Number(payload.borrowLimit || 5),
    createdAt,
    updatedAt: createdAt
  };
};

const buildInitialDb = () => {
  const createdAt = now();
  const categories = CSE_SUBJECTS.map((subject, index) => ({
    _id: `cat-${String(index + 1).padStart(3, "0")}`,
    name: subject.name,
    description: `BTech CSE semester ${subject.semester} resources for ${subject.name}.`,
    createdAt,
    updatedAt: createdAt
  }));
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const books = buildCseBookCatalog().map((book, index) => ({
    ...book,
    _id: `book-${String(index + 1).padStart(4, "0")}`,
    category: categoryByName.get(book.categoryName)._id,
    createdAt,
    updatedAt: createdAt
  }));
  const users = [
    createUser({
      _id: "user-librarian",
      name: "Library Admin",
      email: "librarian@example.com",
      role: "librarian",
      phone: "9876543210",
      borrowLimit: 20,
      semester: 8,
      studentId: "LIB2026001",
      enrollmentYear: 2021,
      createdAt
    }),
    createUser({
      _id: "user-member",
      name: "Aarav Sharma",
      email: "member@example.com",
      role: "member",
      phone: "9876501234",
      semester: 5,
      studentId: "CSE2025001",
      enrollmentYear: 2022,
      createdAt
    }),
    createUser({
      _id: "user-late",
      name: "Nisha Verma",
      email: "late@example.com",
      role: "member",
      phone: "9876509876",
      semester: 6,
      studentId: "CSE2025002",
      enrollmentYear: 2021,
      createdAt
    })
  ];

  books[0].availableCopies -= 1;
  books[1].availableCopies -= 1;
  const borrowRecords = [
    {
      _id: "borrow-active-1",
      member: "user-member",
      book: books[0]._id,
      issuedBy: "user-librarian",
      status: "borrowed",
      issueDate: daysFromNow(-3),
      dueDate: daysFromNow(11),
      returnDate: null,
      fine: 0,
      notes: "",
      createdAt: daysFromNow(-3),
      updatedAt: daysFromNow(-3)
    },
    {
      _id: "borrow-overdue-1",
      member: "user-late",
      book: books[1]._id,
      issuedBy: "user-librarian",
      status: "overdue",
      issueDate: daysFromNow(-21),
      dueDate: daysFromNow(-7),
      returnDate: null,
      fine: 0,
      notes: "",
      createdAt: daysFromNow(-21),
      updatedAt: daysFromNow(-7)
    }
  ];
  const notifications = [
    {
      _id: "notification-active-1",
      user: "user-member",
      type: "borrow_confirmation",
      title: "Book borrowed",
      message: `You borrowed "${books[0].title}".`,
      isRead: false,
      relatedBorrowRecord: "borrow-active-1",
      dueDate: borrowRecords[0].dueDate,
      createdAt: daysFromNow(-3),
      updatedAt: daysFromNow(-3)
    },
    {
      _id: "notification-overdue-1",
      user: "user-late",
      type: "overdue_alert",
      title: "Book overdue",
      message: `The book "${books[1].title}" is overdue.`,
      isRead: false,
      relatedBorrowRecord: "borrow-overdue-1",
      dueDate: borrowRecords[1].dueDate,
      createdAt: daysFromNow(-7),
      updatedAt: daysFromNow(-7)
    }
  ];

  return {
    meta: {
      name: "StackShelf Local JSON Database",
      createdAt,
      updatedAt: createdAt
    },
    categories,
    books,
    users,
    borrowRecords,
    notifications
  };
};

const loadDb = async () => {
  if (dbCache) {
    return dbCache;
  }

  await fs.mkdir(dataDir, { recursive: true });

  try {
    dbCache = JSON.parse(await fs.readFile(dbPath, "utf8"));
  } catch (error) {
    dbCache = buildInitialDb();
    await saveDb();
  }

  return dbCache;
};

const saveDb = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  dbCache.meta.updatedAt = now();
  await fs.writeFile(dbPath, `${JSON.stringify(dbCache, null, 2)}\n`);
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, jsonHeaders);
  res.end(JSON.stringify(payload));
};

const sendError = (res, statusCode, message) => sendJson(res, statusCode, {
  status: "error",
  message
});

const parseBody = async (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const rawBody = Buffer.concat(chunks).toString("utf8").trim();

    if (!rawBody) {
      resolve({});
      return;
    }

    try {
      resolve(JSON.parse(rawBody));
    } catch (error) {
      reject(new Error("Request body must be valid JSON."));
    }
  });
  req.on("error", reject);
});

const getCurrentUser = async (req) => {
  const tokenPayload = readToken(req.headers.authorization);

  if (!tokenPayload) {
    return null;
  }

  const db = await loadDb();
  return db.users.find((user) => user._id === tokenPayload.userId) || null;
};

const requireAuth = async (req, res) => {
  const user = await getCurrentUser(req);

  if (!user) {
    sendError(res, 401, "Please sign in to continue.");
    return null;
  }

  return user;
};

const requireLibrarian = (user, res) => {
  if (user.role !== "librarian") {
    sendError(res, 403, "This action is only available to librarians.");
    return false;
  }

  return true;
};

const getCategory = (db, categoryId) => db.categories.find((category) => category._id === categoryId) || null;
const getBook = (db, bookId) => db.books.find((book) => book._id === bookId) || null;
const getUser = (db, userId) => db.users.find((user) => user._id === userId) || null;

const populateBook = (db, book) => ({
  ...book,
  category: getCategory(db, book.category)
});

const populateRecord = (db, record) => ({
  ...record,
  member: sanitizeUser(getUser(db, record.member)),
  book: getBook(db, record.book),
  issuedBy: sanitizeUser(getUser(db, record.issuedBy)),
  returnedTo: record.returnedTo ? sanitizeUser(getUser(db, record.returnedTo)) : null
});

const paginate = (items, query) => {
  const page = Math.max(1, Number(query.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(query.get("limit") || 20)));
  const total = items.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;

  return {
    rows: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      pages
    }
  };
};

const sortRows = (rows, sortValue = "title") => {
  const descending = sortValue.startsWith("-");
  const field = descending ? sortValue.slice(1) : sortValue;

  return [...rows].sort((left, right) => {
    const a = left[field] ?? "";
    const b = right[field] ?? "";

    if (typeof a === "number" && typeof b === "number") {
      return descending ? b - a : a - b;
    }

    return descending
      ? String(b).localeCompare(String(a))
      : String(a).localeCompare(String(b));
  });
};

const calculateFine = (dueDate, returnedAt = new Date()) => {
  const due = new Date(dueDate);
  const returned = new Date(returnedAt);

  if (Number.isNaN(due.getTime()) || returned <= due) {
    return 0;
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const finePerDay = Number(process.env.FINE_PER_DAY || 5);
  return Math.ceil((returned - due) / dayMs) * finePerDay;
};

const markOverdueRecords = async (db) => {
  let changed = false;
  const currentDate = new Date();

  db.borrowRecords.forEach((record) => {
    if (record.status === "borrowed" && new Date(record.dueDate) < currentDate) {
      const book = getBook(db, record.book);
      record.status = "overdue";
      record.updatedAt = now();
      changed = true;

      const alreadyNotified = db.notifications.some((notification) => (
        notification.type === "overdue_alert" &&
        notification.relatedBorrowRecord === record._id
      ));

      if (!alreadyNotified) {
        db.notifications.push({
          _id: createId("notification"),
          user: record.member,
          type: "overdue_alert",
          title: "Book overdue",
          message: `The book "${book ? book.title : "borrowed book"}" is overdue.`,
          isRead: false,
          relatedBorrowRecord: record._id,
          dueDate: record.dueDate,
          createdAt: now(),
          updatedAt: now()
        });
      }
    }
  });

  if (changed) {
    await saveDb();
  }

  return changed;
};

const handleHealth = async (res) => {
  await loadDb();
  sendJson(res, 200, {
    status: "success",
    timestamp: now(),
    database: {
      status: "connected",
      engine: "local-json",
      path: dbPath
    }
  });
};

const handleRegister = async (req, res) => {
  const db = await loadDb();
  const body = await parseBody(req);
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");

  if (!body.name || !email || password.length < 8) {
    sendError(res, 400, "Name, email, and a password of at least 8 characters are required.");
    return;
  }

  if (db.users.some((user) => user.email === email)) {
    sendError(res, 409, "Email is already registered.");
    return;
  }

  if (body.studentId && db.users.some((user) => user.studentId === String(body.studentId).toUpperCase())) {
    sendError(res, 409, "Student ID is already registered.");
    return;
  }

  const user = createUser({ ...body, email, role: body.role === "librarian" ? "librarian" : "member" });
  db.users.push(user);
  db.notifications.push({
    _id: createId("notification"),
    user: user._id,
    type: "welcome",
    title: "Welcome to StackShelf",
    message: "Your member account has been created and saved in the local database.",
    isRead: false,
    createdAt: now(),
    updatedAt: now()
  });
  await saveDb();

  sendJson(res, 201, {
    status: "success",
    token: createToken(user._id),
    data: {
      user: sanitizeUser(user)
    }
  });
};

const handleLogin = async (req, res) => {
  const db = await loadDb();
  const body = await parseBody(req);
  const user = db.users.find((item) => item.email === String(body.email || "").toLowerCase());

  if (!user || !verifyPassword(body.password || "", user)) {
    sendError(res, 401, "Invalid email or password.");
    return;
  }

  sendJson(res, 200, {
    status: "success",
    token: createToken(user._id),
    data: {
      user: sanitizeUser(user)
    }
  });
};

const handleMe = async (req, res) => {
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  if (req.method === "PATCH") {
    const body = await parseBody(req);
    ["name", "phone", "address", "department"].forEach((field) => {
      if (body[field] !== undefined) {
        user[field] = body[field];
      }
    });

    if (body.semester !== undefined) {
      user.semester = Number(body.semester);
    }

    user.updatedAt = now();
    await saveDb();
  }

  sendJson(res, 200, {
    status: "success",
    data: {
      user: sanitizeUser(user)
    }
  });
};

const handleCategories = async (res) => {
  const db = await loadDb();
  sendJson(res, 200, {
    status: "success",
    results: db.categories.length,
    data: {
      categories: db.categories
    }
  });
};

const handleBooks = async (req, res, url) => {
  const db = await loadDb();

  if (req.method === "POST") {
    const user = await requireAuth(req, res);

    if (!user || !requireLibrarian(user, res)) {
      return;
    }

    const body = await parseBody(req);
    const book = {
      _id: createId("book"),
      title: body.title,
      isbn: body.isbn || `97893${String(Date.now()).slice(-8)}`,
      author: body.author,
      category: body.category,
      course: body.course || "BTech CSE",
      department: body.department || "Computer Science and Engineering",
      semester: Number(body.semester || 1),
      subjectCode: body.subjectCode || "CSE",
      edition: body.edition || "Reference Edition",
      publisher: body.publisher || "Campus Computing Press",
      publishedYear: Number(body.publishedYear || new Date().getFullYear()),
      language: body.language || "English",
      totalCopies: Number(body.totalCopies || 1),
      availableCopies: Number(body.totalCopies || 1),
      shelfLocation: body.shelfLocation || "CSE-NEW",
      description: body.description || "",
      tags: body.tags || ["btech cse"],
      createdAt: now(),
      updatedAt: now()
    };

    if (!book.title || !book.author || !book.category) {
      sendError(res, 400, "Title, author, and category are required.");
      return;
    }

    db.books.push(book);
    await saveDb();
    sendJson(res, 201, { status: "success", data: { book: populateBook(db, book) } });
    return;
  }

  let rows = db.books.map((book) => populateBook(db, book));
  const query = url.searchParams;
  const search = String(query.get("search") || "").toLowerCase();
  const category = query.get("category");
  const author = String(query.get("author") || "").toLowerCase();
  const availability = query.get("availability");
  const semester = query.get("semester");
  const subjectCode = String(query.get("subjectCode") || "").toLowerCase();
  const course = String(query.get("course") || "").toLowerCase();

  if (search) {
    rows = rows.filter((book) => [
      book.title,
      book.isbn,
      book.author,
      book.subjectCode,
      book.publisher,
      ...(book.tags || [])
    ].some((value) => String(value || "").toLowerCase().includes(search)));
  }

  if (category) {
    rows = rows.filter((book) => book.category?._id === category || book.category?.name.toLowerCase() === category.toLowerCase());
  }

  if (author) {
    rows = rows.filter((book) => String(book.author || "").toLowerCase().includes(author));
  }

  if (semester) {
    rows = rows.filter((book) => Number(book.semester) === Number(semester));
  }

  if (subjectCode) {
    rows = rows.filter((book) => String(book.subjectCode || "").toLowerCase() === subjectCode);
  }

  if (course) {
    rows = rows.filter((book) => String(book.course || "").toLowerCase() === course);
  }

  if (availability === "available") {
    rows = rows.filter((book) => book.availableCopies > 0);
  }

  if (availability === "unavailable") {
    rows = rows.filter((book) => book.availableCopies <= 0);
  }

  rows = sortRows(rows, query.get("sort") || "title");
  const { rows: books, pagination } = paginate(rows, query);

  sendJson(res, 200, {
    status: "success",
    results: books.length,
    pagination,
    data: {
      books
    }
  });
};

const handleBookById = async (req, res, bookId) => {
  const db = await loadDb();
  const book = getBook(db, bookId);

  if (!book) {
    sendError(res, 404, "Book not found.");
    return;
  }

  if (req.method === "DELETE") {
    const user = await requireAuth(req, res);

    if (!user || !requireLibrarian(user, res)) {
      return;
    }

    const activeBorrow = db.borrowRecords.some((record) => (
      record.book === bookId && ["borrowed", "overdue"].includes(record.status)
    ));

    if (activeBorrow) {
      sendError(res, 400, "Cannot delete a book that is currently borrowed.");
      return;
    }

    db.books = db.books.filter((item) => item._id !== bookId);
    await saveDb();
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  sendJson(res, 200, {
    status: "success",
    data: {
      book: populateBook(db, book)
    }
  });
};

const handleBorrowBook = async (req, res, bookId) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  const body = await parseBody(req);
  const member = user.role === "librarian"
    ? getUser(db, body.memberId)
    : user;
  const book = getBook(db, bookId);

  if (!member || member.role !== "member") {
    sendError(res, 404, "Member not found.");
    return;
  }

  if (member.membershipStatus !== "active") {
    sendError(res, 403, "Only active members can borrow books.");
    return;
  }

  const activeBorrowCount = db.borrowRecords.filter((record) => (
    record.member === member._id && ["borrowed", "overdue"].includes(record.status)
  )).length;

  if (activeBorrowCount >= member.borrowLimit) {
    sendError(res, 400, "Borrow limit reached for this member.");
    return;
  }

  if (!book) {
    sendError(res, 404, "Book not found.");
    return;
  }

  if (book.availableCopies < 1) {
    sendError(res, 400, "This book is currently unavailable.");
    return;
  }

  const dueDate = body.dueDate || daysFromNow(14);
  const record = {
    _id: createId("borrow"),
    member: member._id,
    book: book._id,
    issuedBy: user._id,
    status: "borrowed",
    issueDate: now(),
    dueDate,
    returnDate: null,
    fine: 0,
    notes: body.notes || "",
    createdAt: now(),
    updatedAt: now()
  };

  book.availableCopies -= 1;
  book.updatedAt = now();
  db.borrowRecords.push(record);
  db.notifications.push({
    _id: createId("notification"),
    user: member._id,
    type: "borrow_confirmation",
    title: "Book borrowed",
    message: `You borrowed "${book.title}". Due date: ${new Date(dueDate).toDateString()}.`,
    isRead: false,
    relatedBorrowRecord: record._id,
    dueDate,
    createdAt: now(),
    updatedAt: now()
  });
  await saveDb();

  sendJson(res, 201, {
    status: "success",
    data: {
      borrowRecord: populateRecord(db, record)
    }
  });
};

const handleReturnBook = async (req, res, recordId) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  const record = db.borrowRecords.find((item) => item._id === recordId);

  if (!record) {
    sendError(res, 404, "Borrow record not found.");
    return;
  }

  if (user.role === "member" && record.member !== user._id) {
    sendError(res, 403, "Members can only return their own borrowed books.");
    return;
  }

  if (record.status === "returned") {
    sendError(res, 400, "This book has already been returned.");
    return;
  }

  const book = getBook(db, record.book);
  record.status = "returned";
  record.returnDate = now();
  record.returnedTo = user.role === "librarian" ? user._id : null;
  record.fine = calculateFine(record.dueDate, record.returnDate);
  record.updatedAt = now();

  if (book) {
    book.availableCopies += 1;
    book.updatedAt = now();
  }

  db.notifications.push({
    _id: createId("notification"),
    user: record.member,
    type: "return_confirmation",
    title: "Book returned",
    message: `You returned "${book ? book.title : "the book"}".`,
    isRead: false,
    relatedBorrowRecord: record._id,
    createdAt: now(),
    updatedAt: now()
  });
  await saveDb();

  sendJson(res, 200, {
    status: "success",
    data: {
      borrowRecord: populateRecord(db, record)
    }
  });
};

const handleBorrowHistory = async (req, res, url) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  await markOverdueRecords(db);
  let rows = db.borrowRecords.map((record) => populateRecord(db, record));
  const status = url.searchParams.get("status");

  if (user.role === "member") {
    rows = rows.filter((record) => record.member?._id === user._id);
  }

  if (status) {
    rows = rows.filter((record) => record.status === status);
  }

  rows = sortRows(rows, url.searchParams.get("sort") || "-createdAt");
  const { rows: records, pagination } = paginate(rows, url.searchParams);

  sendJson(res, 200, {
    status: "success",
    results: records.length,
    pagination,
    data: {
      records
    }
  });
};

const handleOverdueRecords = async (req, res) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user || !requireLibrarian(user, res)) {
    return;
  }

  await markOverdueRecords(db);
  const records = db.borrowRecords
    .filter((record) => record.status === "overdue")
    .map((record) => populateRecord(db, record))
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));

  sendJson(res, 200, {
    status: "success",
    results: records.length,
    data: {
      records
    }
  });
};

const handleAvailability = async (req, res, bookId) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  const book = getBook(db, bookId);

  if (!book) {
    sendError(res, 404, "Book not found.");
    return;
  }

  sendJson(res, 200, {
    status: "success",
    data: {
      bookId: book._id,
      title: book.title,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      isAvailable: book.availableCopies > 0
    }
  });
};

const handleNotifications = async (req, res, url) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  await markOverdueRecords(db);
  let rows = db.notifications.filter((notification) => (
    user.role === "librarian" || notification.user === user._id
  ));
  const isRead = url.searchParams.get("isRead");

  if (isRead !== null && isRead !== "") {
    rows = rows.filter((notification) => String(notification.isRead) === isRead);
  }

  rows = sortRows(rows, url.searchParams.get("sort") || "-createdAt");
  const { rows: notifications, pagination } = paginate(rows, url.searchParams);

  sendJson(res, 200, {
    status: "success",
    results: notifications.length,
    pagination,
    data: {
      notifications
    }
  });
};

const handleReadNotification = async (req, res, notificationId) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  const notification = db.notifications.find((item) => item._id === notificationId);

  if (!notification || (user.role === "member" && notification.user !== user._id)) {
    sendError(res, 404, "Notification not found.");
    return;
  }

  notification.isRead = true;
  notification.updatedAt = now();
  await saveDb();
  sendJson(res, 200, { status: "success", data: { notification } });
};

const handleMembers = async (req, res, url) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user || !requireLibrarian(user, res)) {
    return;
  }

  let rows = db.users.filter((item) => item.role === "member").map(sanitizeUser);
  const search = String(url.searchParams.get("search") || "").toLowerCase();
  const membershipStatus = url.searchParams.get("membershipStatus");

  if (search) {
    rows = rows.filter((member) => (
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      String(member.studentId || "").toLowerCase().includes(search)
    ));
  }

  if (membershipStatus) {
    rows = rows.filter((member) => member.membershipStatus === membershipStatus);
  }

  rows = sortRows(rows, url.searchParams.get("sort") || "name");
  const { rows: members, pagination } = paginate(rows, url.searchParams);

  sendJson(res, 200, {
    status: "success",
    results: members.length,
    pagination,
    data: {
      members
    }
  });
};

const handleMemberStatus = async (req, res, memberId) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user || !requireLibrarian(user, res)) {
    return;
  }

  const member = getUser(db, memberId);

  if (!member || member.role !== "member") {
    sendError(res, 404, "Member not found.");
    return;
  }

  const body = await parseBody(req);
  if (body.membershipStatus) {
    member.membershipStatus = body.membershipStatus;
  }

  if (body.borrowLimit !== undefined) {
    member.borrowLimit = Number(body.borrowLimit);
  }

  member.updatedAt = now();
  await saveDb();
  sendJson(res, 200, {
    status: "success",
    data: {
      member: sanitizeUser(member)
    }
  });
};

const handleReports = async (req, res, pathname) => {
  const db = await loadDb();
  const user = await requireAuth(req, res);

  if (!user || !requireLibrarian(user, res)) {
    return;
  }

  await markOverdueRecords(db);

  if (pathname === "/api/v1/reports/inventory-status") {
    const summary = db.books.reduce((acc, book) => {
      acc.totalTitles += 1;
      acc.totalCopies += book.totalCopies;
      acc.availableCopies += book.availableCopies;
      acc.borrowedCopies += book.totalCopies - book.availableCopies;
      return acc;
    }, { totalTitles: 0, totalCopies: 0, availableCopies: 0, borrowedCopies: 0 });
    const categories = db.categories.map((category) => {
      const books = db.books.filter((book) => book.category === category._id);
      return books.reduce((acc, book) => {
        acc.titles += 1;
        acc.totalCopies += book.totalCopies;
        acc.availableCopies += book.availableCopies;
        acc.borrowedCopies += book.totalCopies - book.availableCopies;
        return acc;
      }, {
        categoryId: category._id,
        category: category.name,
        titles: 0,
        totalCopies: 0,
        availableCopies: 0,
        borrowedCopies: 0
      });
    });

    sendJson(res, 200, { status: "success", data: { summary, categories } });
    return;
  }

  if (pathname === "/api/v1/reports/most-borrowed-books") {
    const borrowCountByBook = new Map();
    db.borrowRecords.forEach((record) => {
      borrowCountByBook.set(record.book, (borrowCountByBook.get(record.book) || 0) + 1);
    });
    const books = [...borrowCountByBook.entries()]
      .map(([bookId, borrowCount]) => ({ ...getBook(db, bookId), bookId, borrowCount }))
      .filter((book) => book._id)
      .sort((left, right) => right.borrowCount - left.borrowCount)
      .slice(0, 10);

    sendJson(res, 200, { status: "success", data: { books } });
    return;
  }

  if (pathname === "/api/v1/reports/active-members") {
    const members = db.users
      .filter((member) => member.role === "member")
      .map((member) => {
        const records = db.borrowRecords.filter((record) => record.member === member._id);
        return {
          ...sanitizeUser(member),
          totalBorrows: records.length,
          activeBorrows: records.filter((record) => ["borrowed", "overdue"].includes(record.status)).length
        };
      })
      .sort((left, right) => right.totalBorrows - left.totalBorrows)
      .slice(0, 20);

    sendJson(res, 200, { status: "success", data: { members } });
    return;
  }

  if (pathname === "/api/v1/reports/overdue-records") {
    const records = db.borrowRecords
      .filter((record) => ["borrowed", "overdue"].includes(record.status) && new Date(record.dueDate) < new Date())
      .map((record) => populateRecord(db, { ...record, status: "overdue" }))
      .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate));

    sendJson(res, 200, {
      status: "success",
      results: records.length,
      data: {
        records
      }
    });
    return;
  }

  sendError(res, 404, "Report not found.");
};

const serveFrontend = async (res, pathname) => {
  const cleanPathname = pathname === "/" ? "/index.html" : pathname;
  const requested = path.resolve(frontendRoot, `.${decodeURIComponent(cleanPathname)}`);
  const root = path.resolve(frontendRoot);

  if (!requested.startsWith(root)) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  try {
    const data = await fs.readFile(requested);
    res.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(requested)) || "application/octet-stream"
    });
    res.end(data);
  } catch (error) {
    const fallback = await fs.readFile(path.join(frontendRoot, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
  }
};

const route = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, jsonHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  try {
    if (pathname === "/health" && req.method === "GET") return handleHealth(res);
    if (pathname === "/api/v1/auth/register" && req.method === "POST") return handleRegister(req, res);
    if (pathname === "/api/v1/auth/login" && req.method === "POST") return handleLogin(req, res);
    if (pathname === "/api/v1/auth/me" && ["GET", "PATCH"].includes(req.method)) return handleMe(req, res);
    if (pathname === "/api/v1/categories" && req.method === "GET") return handleCategories(res);
    if (pathname === "/api/v1/books" && ["GET", "POST"].includes(req.method)) return handleBooks(req, res, url);
    if (pathname.startsWith("/api/v1/books/") && ["GET", "DELETE"].includes(req.method)) {
      return handleBookById(req, res, decodeURIComponent(pathname.slice("/api/v1/books/".length)));
    }
    if (pathname === "/api/v1/borrows/history" && req.method === "GET") return handleBorrowHistory(req, res, url);
    if (pathname === "/api/v1/borrows/overdue" && req.method === "GET") return handleOverdueRecords(req, res);
    if (pathname.startsWith("/api/v1/borrows/availability/") && req.method === "GET") {
      return handleAvailability(req, res, decodeURIComponent(pathname.slice("/api/v1/borrows/availability/".length)));
    }
    if (pathname.startsWith("/api/v1/borrows/return/") && req.method === "PATCH") {
      return handleReturnBook(req, res, decodeURIComponent(pathname.slice("/api/v1/borrows/return/".length)));
    }
    if (pathname.startsWith("/api/v1/borrows/") && req.method === "POST") {
      return handleBorrowBook(req, res, decodeURIComponent(pathname.slice("/api/v1/borrows/".length)));
    }
    if (pathname === "/api/v1/notifications" && req.method === "GET") return handleNotifications(req, res, url);
    if (pathname.startsWith("/api/v1/notifications/") && pathname.endsWith("/read") && req.method === "PATCH") {
      const notificationId = pathname
        .slice("/api/v1/notifications/".length)
        .replace(/\/read$/, "");
      return handleReadNotification(req, res, decodeURIComponent(notificationId));
    }
    if (pathname === "/api/v1/members" && req.method === "GET") return handleMembers(req, res, url);
    if (pathname.startsWith("/api/v1/members/") && pathname.endsWith("/status") && req.method === "PATCH") {
      const memberId = pathname
        .slice("/api/v1/members/".length)
        .replace(/\/status$/, "");
      return handleMemberStatus(req, res, decodeURIComponent(memberId));
    }
    if (pathname.startsWith("/api/v1/reports/") && req.method === "GET") return handleReports(req, res, pathname);
    if (pathname.startsWith("/api/")) return sendError(res, 404, "API endpoint not found.");

    return serveFrontend(res, pathname);
  } catch (error) {
    sendError(res, 500, error.message || "Unexpected server error.");
  }
};

const server = http.createServer(route);

server.listen(port, "127.0.0.1", async () => {
  await loadDb();
  console.log(`StackShelf local API running at http://localhost:${port}`);
  console.log(`Local database: ${dbPath}`);
  console.log("Demo accounts:");
  console.log("  Librarian: librarian@example.com / Password@123");
  console.log("  Student: member@example.com / Password@123");
  console.log("  Overdue: late@example.com / Password@123");
});
