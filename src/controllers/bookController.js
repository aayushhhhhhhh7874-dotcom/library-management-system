const mongoose = require("mongoose");
const Book = require("../models/Book");
const Category = require("../models/Category");
const BorrowRecord = require("../models/BorrowRecord");
const { BORROW_STATUS } = require("../constants/roles");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const buildCategoryFilter = async (category) => {
  if (!category) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(category)) {
    return category;
  }

  const matchedCategory = await Category.findOne({
    name: new RegExp(`^${category}$`, "i")
  });

  return matchedCategory ? matchedCategory._id : "__no_category_match__";
};

const createBook = catchAsync(async (req, res, next) => {
  if (
    req.body.availableCopies !== undefined &&
    req.body.availableCopies > req.body.totalCopies
  ) {
    return next(new AppError("Available copies cannot exceed total copies.", 400));
  }

  const book = await Book.create(req.body);

  return res.status(201).json({
    status: "success",
    data: {
      book
    }
  });
});

const getBooks = catchAsync(async (req, res) => {
  const {
    search,
    category,
    author,
    availability,
    page,
    limit,
    sort
  } = req.query;

  const filter = {};

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { title: regex },
      { isbn: regex },
      { author: regex }
    ];
  }

  if (author) {
    filter.author = new RegExp(author, "i");
  }

  const categoryFilter = await buildCategoryFilter(category);
  if (categoryFilter) {
    filter.category = categoryFilter;
  }

  if (availability === "available") {
    filter.availableCopies = { $gt: 0 };
  }

  if (availability === "unavailable") {
    filter.availableCopies = 0;
  }

  const skip = (page - 1) * limit;
  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate("category", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Book.countDocuments(filter)
  ]);

  res.status(200).json({
    status: "success",
    results: books.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      books
    }
  });
});

const getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate("category", "name");

  if (!book) {
    return next(new AppError("Book not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      book
    }
  });
});

const updateBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError("Book not found.", 404));
  }

  if (req.body.totalCopies !== undefined) {
    const borrowedCopies = book.totalCopies - book.availableCopies;

    if (req.body.totalCopies < borrowedCopies) {
      return next(new AppError("Total copies cannot be lower than borrowed copies.", 400));
    }

    const nextAvailableCopies = req.body.totalCopies - borrowedCopies;
    req.body.availableCopies = req.body.availableCopies ?? nextAvailableCopies;
  }

  if (
    req.body.availableCopies !== undefined &&
    req.body.totalCopies !== undefined &&
    req.body.availableCopies > req.body.totalCopies
  ) {
    return next(new AppError("Available copies cannot exceed total copies.", 400));
  }

  if (
    req.body.availableCopies !== undefined &&
    req.body.totalCopies === undefined &&
    req.body.availableCopies > book.totalCopies
  ) {
    return next(new AppError("Available copies cannot exceed total copies.", 400));
  }

  Object.assign(book, req.body);
  await book.save({ validateModifiedOnly: true });

  return res.status(200).json({
    status: "success",
    data: {
      book
    }
  });
});

const deleteBook = catchAsync(async (req, res, next) => {
  const activeBorrowRecord = await BorrowRecord.findOne({
    book: req.params.id,
    status: { $in: [BORROW_STATUS.BORROWED, BORROW_STATUS.OVERDUE] }
  });

  if (activeBorrowRecord) {
    return next(new AppError("Cannot delete a book that is currently borrowed.", 400));
  }

  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(new AppError("Book not found.", 404));
  }

  return res.status(204).send();
});

module.exports = {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook
};
