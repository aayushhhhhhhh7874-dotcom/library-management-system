class BorrowRecord {
  String id;
  String memberId;
  String bookId;
  String issuedById;
  String returnedToId = "";
  String status;
  String issueDate;
  String dueDate;
  String returnDate;
  int fine = 0;
  String notes = "";
  String createdAt;
  String updatedAt;

  BorrowRecord(String id, String memberId, String bookId, String issuedById, String status, String issueDate, String dueDate, String returnDate, String createdAt) {
    this.id = id;
    this.memberId = memberId;
    this.bookId = bookId;
    this.issuedById = issuedById;
    this.status = status;
    this.issueDate = issueDate;
    this.dueDate = dueDate;
    this.returnDate = returnDate;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }
}
