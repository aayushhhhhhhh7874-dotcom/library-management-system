const Book = require("../models/Book");
const BorrowRecord = require("../models/BorrowRecord");
const User = require("../models/User");
const { BORROW_STATUS, ROLES } = require("../constants/roles");
const catchAsync = require("../utils/catchAsync");

const getMostBorrowedBooks = catchAsync(async (req, res) => {
  const books = await BorrowRecord.aggregate([
    {
      $group: {
        _id: "$book",
        borrowCount: { $sum: 1 }
      }
    },
    { $sort: { borrowCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "book"
      }
    },
    { $unwind: "$book" },
    {
      $project: {
        _id: 0,
        bookId: "$book._id",
        title: "$book.title",
        author: "$book.author",
        isbn: "$book.isbn",
        borrowCount: 1
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      books
    }
  });
});

const getActiveMembers = catchAsync(async (req, res) => {
  const members = await User.aggregate([
    { $match: { role: ROLES.MEMBER } },
    {
      $lookup: {
        from: "borrowrecords",
        localField: "_id",
        foreignField: "member",
        as: "borrowRecords"
      }
    },
    {
      $addFields: {
        totalBorrows: { $size: "$borrowRecords" },
        activeBorrows: {
          $size: {
            $filter: {
              input: "$borrowRecords",
              as: "record",
              cond: {
                $in: ["$$record.status", [BORROW_STATUS.BORROWED, BORROW_STATUS.OVERDUE]]
              }
            }
          }
        }
      }
    },
    { $sort: { totalBorrows: -1, activeBorrows: -1 } },
    { $limit: 20 },
    {
      $project: {
        password: 0,
        borrowRecords: 0,
        __v: 0
      }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      members
    }
  });
});

const getOverdueReport = catchAsync(async (req, res) => {
  const records = await BorrowRecord.find({
    status: { $in: [BORROW_STATUS.BORROWED, BORROW_STATUS.OVERDUE] },
    dueDate: { $lt: new Date() }
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

const getInventoryStatus = catchAsync(async (req, res) => {
  const [summary] = await Book.aggregate([
    {
      $group: {
        _id: null,
        totalTitles: { $sum: 1 },
        totalCopies: { $sum: "$totalCopies" },
        availableCopies: { $sum: "$availableCopies" }
      }
    },
    {
      $project: {
        _id: 0,
        totalTitles: 1,
        totalCopies: 1,
        availableCopies: 1,
        borrowedCopies: { $subtract: ["$totalCopies", "$availableCopies"] }
      }
    }
  ]);

  const categories = await Book.aggregate([
    {
      $group: {
        _id: "$category",
        titles: { $sum: 1 },
        totalCopies: { $sum: "$totalCopies" },
        availableCopies: { $sum: "$availableCopies" }
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryId: "$category._id",
        category: "$category.name",
        titles: 1,
        totalCopies: 1,
        availableCopies: 1,
        borrowedCopies: { $subtract: ["$totalCopies", "$availableCopies"] }
      }
    },
    { $sort: { category: 1 } }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      summary: summary || {
        totalTitles: 0,
        totalCopies: 0,
        availableCopies: 0,
        borrowedCopies: 0
      },
      categories
    }
  });
});

module.exports = {
  getMostBorrowedBooks,
  getActiveMembers,
  getOverdueReport,
  getInventoryStatus
};
