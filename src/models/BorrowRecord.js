const mongoose = require("mongoose");
const { BORROW_STATUS } = require("../constants/roles");

const borrowRecordSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(BORROW_STATUS),
      default: BORROW_STATUS.BORROWED,
      index: true
    },
    fine: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
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

borrowRecordSchema.index({ member: 1, status: 1 });
borrowRecordSchema.index({ book: 1, status: 1 });
borrowRecordSchema.index({ dueDate: 1, status: 1 });

borrowRecordSchema.virtual("isOverdue").get(function isOverdue() {
  return this.status !== BORROW_STATUS.RETURNED && this.dueDate < new Date();
});

module.exports = mongoose.model("BorrowRecord", borrowRecordSchema);
