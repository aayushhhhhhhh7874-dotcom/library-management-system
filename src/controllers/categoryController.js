const Category = require("../models/Category");
const Book = require("../models/Book");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      category
    }
  });
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.find().sort("name");

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories
    }
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      category
    }
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const booksInCategory = await Book.countDocuments({ category: req.params.id });

  if (booksInCategory > 0) {
    return next(new AppError("Cannot delete a category that still has books.", 400));
  }

  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  return res.status(204).send();
});

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
};
