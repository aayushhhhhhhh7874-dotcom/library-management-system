class Notification {
  String id;
  String userId;
  String type;
  String title;
  String message;
  boolean read;
  String relatedBorrowRecord;
  String dueDate;
  String createdAt;
  String updatedAt;

  Notification(String id, String userId, String type, String title, String message, boolean read, String relatedBorrowRecord, String dueDate, String createdAt) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.title = title;
    this.message = message;
    this.read = read;
    this.relatedBorrowRecord = relatedBorrowRecord;
    this.dueDate = dueDate;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }
}
