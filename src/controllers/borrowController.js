const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");
const User = require("../models/User");
const {
  BORROW_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  ROLES
} = require("../constants/roles");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { calculateFine } = require("../utils/fines");
const { createNotification } = require("../utils/notifications");

const getDefaultDueDate = () => {
  const borrowDays = Number(process.env.BORROW_DAYS || 14);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + borrowDays);
  return dueDate;
};

const markOverdueRecords = async () => {
  const overdueRecords = await BorrowRecord.find({
    status: BORROW_STATUS.BORROWED,
    dueDate: { $lt: new Date() }
  }).populate("book", "title");

  await Promise.all(overdueRecords.map(async (record) => {
    record.status = BORROW_STATUS.OVERDUE;
    await record.save({ validateModifiedOnly: true });

    await createNotification({
      user: record.member,
      type: NOTIFICATION_TYPES.OVERDUE_ALERT,
      title: "Book overdue",
      message: `The book "${record.book.title}" is overdue.`,
      relatedBorrowRecord: record._id,
      dueDate: record.dueDate
    });
  }));
};

const resolveBorrowingMember = async (req) => {
  if (req.user.role === ROLES.LIBRARIAN) {
    if (!req.body.memberId) {
      throw new AppError("memberId is required when a librarian issues a book.", 400);
    }

    return User.findOne({
      _id: req.body.memberId,
      role: ROLES.MEMBER
    });
  }

  if (req.body.memberId && req.body.memberId.toString() !== req.user._id.toString()) {
    throw new AppError("Members can only borrow books for themselves.", 403);
  }

  return req.user;
};

const borrowBook = catchAsync(async (req, res, next) => {
  const member = await resolveBorrowingMember(req);

  if (!member) {
    return next(new AppError("Member not found.", 404));
  }

  if (member.membershipStatus !== MEMBERSHIP_STATUS.ACTIVE) {
    return next(new AppError("Only active members can borrow books.", 403));
  }

  const activeBorrowCount = await BorrowRecord.countDocuments({
    member: member._id,
    status: { $in: [BORROW_STATUS.BORROWED, BORROW_STATUS.OVERDUE] }
  });

  if (activeBorrowCount >= member.borrowLimit) {
    return next(new AppError("Borrow limit reached for this member.", 400));
  }

  const book = await Book.findById(req.params.bookId);

  if (!book) {
    return next(new AppError("Book not found.", 404));
  }

  if (book.availableCopies < 1) {
    return next(new AppError("This book is currently unavailable.", 400));
  }

  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : getDefaultDueDate();

  const record = await BorrowRecord.create({
    member: member._id,
    book: book._id,
    issuedBy: req.user._id,
    dueDate,
    notes: req.body.notes
  });

  book.availableCopies -= 1;
  await book.save({ validateModifiedOnly: true });

  await createNotification({
    user: member._id,
    type: NOTIFICATION_TYPES.BORROW_CONFIRMATION,
    title: "Book borrowed",
    message: `You borrowed "${book.title}". Due date: ${dueDate.toDateString()}.`,
    relatedBorrowRecord: record._id,
    dueDate
  });

  const populatedRecord = await BorrowRecord.findById(record._id)
    .populate("member", "name email")
    .populate("book", "title isbn author")
    .populate("issuedBy", "name email");

  return res.status(201).json({
    status: "success",
    data: {
      borrowRecord: populatedRecord
    }
  });
});

const returnBook = catchAsync(async (req, res, next) => {
  const record = await BorrowRecord.findById(req.params.recordId)
    .populate("book")
    .populate("member", "name email");

  if (!record) {
    return next(new AppError("Borrow record not found.", 404));
  }

  if (
    req.user.role === ROLES.MEMBER &&
    record.member._id.toString() !== req.user._id.toString()
  ) {
    return next(new AppError("Members can only return their own borrowed books.", 403));
  }

  if (record.status === BORROW_STATUS.RETURNED) {
    return next(new AppError("This book has already been returned.", 400));
  }

  const returnedAt = new Date();
  record.status = BORROW_STATUS.RETURNED;
  record.returnDate = returnedAt;
  record.returnedTo = req.user.role === ROLES.LIBRARIAN ? req.user._id : undefined;
  record.fine = calculateFine(record.dueDate, returnedAt);
  record.notes = req.body.notes || record.notes;
  await record.save({ validateModifiedOnly: true });

  record.book.availableCopies += 1;
  await record.book.save({ validateModifiedOnly: true });

  await createNotification({
    user: record.member._id,
    type: NOTIFICATION_TYPES.RETURN_CONFIRMATION,
    title: "Book returned",
    message: `You returned "${record.book.title}". Fine: ${record.fine}.`,
    relatedBorrowRecord: record._id
  });

  return res.status(200).json({
    status: "success",
    data: {
      borrowRecord: record
    }
  });
});

const getBorrowingHistory = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    sort,
    status
  } = req.query;

  const filter = {};

  if (req.user.role === ROLES.MEMBER) {
    filter.member = req.user._id;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    BorrowRecord.find(filter)
      .populate("member", "name email")
      .populate("book", "title isbn author")
      .populate("issuedBy", "name email")
      .populate("returnedTo", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    BorrowRecord.countDocuments(filter)
  ]);

  res.status(200).json({
    status: "success",
    results: records.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      records
    }
  });
});

const getOverdueRecords = catchAsync(async (req, res) => {
  await markOverdueRecords();

  const records = await BorrowRecord.find({
    status: BORROW_STATUS.OVERDUE
  })
    .populate("member", "name email phone")
    .populate("book", "title isbn author")
    .sort("dueDate");

  res.status(200).json({
    status: "success",
    results: records.length,
    data: {
      records
    }
  });
});

const checkAvailability = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.bookId).populate("category", "name");

  if (!book) {
    return next(new AppError("Book not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      bookId: book._id,
      title: book.title,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      isAvailable: book.availableCopies > 0
    }
  });
});

module.exports = {
  borrowBook,
  returnBook,
  getBorrowingHistory,
  getOverdueRecords,
  checkAvailability
};
