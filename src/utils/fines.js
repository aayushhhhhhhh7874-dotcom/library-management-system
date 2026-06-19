const calculateFine = (dueDate, returnedAt = new Date()) => {
  const finePerDay = Number(process.env.FINE_PER_DAY || 0);
  const due = new Date(dueDate);
  const returned = new Date(returnedAt);

  if (Number.isNaN(due.getTime()) || returned <= due) {
    return 0;
  }

  const dayMs = 1000 * 60 * 60 * 24;
  const overdueDays = Math.ceil((returned - due) / dayMs);
  return overdueDays * finePerDay;
};

module.exports = {
  calculateFine
};
