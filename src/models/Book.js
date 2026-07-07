const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required."],
      trim: true,
      index: true
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required."],
      unique: true,
      trim: true
    },
    author: {
      type: String,
      required: [true, "Author is required."],
      trim: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required."]
    },
    course: {
      type: String,
      default: "BTech CSE",
      trim: true,
      index: true
    },
    department: {
      type: String,
      default: "Computer Science and Engineering",
      trim: true
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
      index: true
    },
    subjectCode: {
      type: String,
      uppercase: true,
      trim: true,
      index: true
    },
    edition: {
      type: String,
      trim: true
    },
    publisher: {
      type: String,
      trim: true
    },
    publishedYear: {
      type: Number,
      min: 1000
    },
    language: {
      type: String,
      default: "English",
      trim: true
    },
    totalCopies: {
      type: Number,
      required: [true, "Total copies is required."],
      min: 0
    },
    availableCopies: {
      type: Number,
      min: 0
    },
    shelfLocation: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

bookSchema.index({
  title: "text",
  author: "text",
  isbn: "text",
  subjectCode: "text",
  tags: "text"
});
bookSchema.index({ category: 1, semester: 1, availableCopies: 1 });

bookSchema.pre("validate", function setAvailableCopies(next) {
  if (this.availableCopies === undefined || this.availableCopies === null) {
    this.availableCopies = this.totalCopies;
  }

  next();
});

bookSchema.virtual("isAvailable").get(function isAvailable() {
  return this.availableCopies > 0;
});

module.exports = mongoose.model("Book", bookSchema);
