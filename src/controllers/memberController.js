const BorrowRecord = require("../models/BorrowRecord");
const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const listMembers = catchAsync(async (req, res) => {
  const {
    search,
    membershipStatus,
    page,
    limit,
    sort
  } = req.query;

  const filter = {
    role: ROLES.MEMBER
  };

  if (membershipStatus) {
    filter.membershipStatus = membershipStatus;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { name: regex },
      { email: regex },
      { phone: regex }
    ];
  }

  const skip = (page - 1) * limit;
  const [members, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    status: "success",
    results: members.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      members
    }
  });
});

const getMember = catchAsync(async (req, res, next) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: ROLES.MEMBER
  });

  if (!member) {
    return next(new AppError("Member not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      member
    }
  });
});

const updateMemberStatus = catchAsync(async (req, res, next) => {
  const member = await User.findOneAndUpdate(
    {
      _id: req.params.id,
      role: ROLES.MEMBER
    },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!member) {
    return next(new AppError("Member not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      member
    }
  });
});

const getBorrowHistory = async (memberId, req, res) => {
  const {
    page,
    limit,
    sort,
    status
  } = req.query;

  const filter = {
    member: memberId
  };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    BorrowRecord.find(filter)
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
};

const getMyBorrowHistory = catchAsync(async (req, res) => {
  await getBorrowHistory(req.user._id, req, res);
});

const getMemberBorrowHistory = catchAsync(async (req, res, next) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: ROLES.MEMBER
  });

  if (!member) {
    return next(new AppError("Member not found.", 404));
  }

  return getBorrowHistory(req.params.id, req, res);
});

module.exports = {
  listMembers,
  getMember,
  updateMemberStatus,
  getMyBorrowHistory,
  getMemberBorrowHistory
};
