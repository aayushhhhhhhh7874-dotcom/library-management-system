class JsonViews {
  private final LibraryDataStore store;

  JsonViews(LibraryDataStore store) {
    this.store = store;
  }

  String category(Category category) {
    return "{"
      + JsonUtil.pair("_id", category.id) + ","
      + JsonUtil.pair("name", category.name) + ","
      + JsonUtil.pair("description", category.description) + ","
      + JsonUtil.pair("createdAt", category.createdAt) + ","
      + JsonUtil.pair("updatedAt", category.updatedAt)
      + "}";
  }

  String user(User user) {
    return "{"
      + JsonUtil.pair("_id", user.id) + ","
      + JsonUtil.pair("name", user.name) + ","
      + JsonUtil.pair("email", user.email) + ","
      + JsonUtil.pair("role", user.role) + ","
      + JsonUtil.pair("phone", user.phone) + ","
      + JsonUtil.pair("address", user.address) + ","
      + JsonUtil.pair("studentId", user.studentId) + ","
      + JsonUtil.pair("department", user.department) + ","
      + "\"semester\":" + user.semester + ","
      + "\"enrollmentYear\":" + user.enrollmentYear + ","
      + JsonUtil.pair("membershipStatus", user.membershipStatus) + ","
      + "\"borrowLimit\":" + user.borrowLimit + ","
      + JsonUtil.pair("createdAt", user.createdAt) + ","
      + JsonUtil.pair("updatedAt", user.updatedAt)
      + "}";
  }

  String book(Book book) {
    Category category = store.findCategory(book.categoryId);
    return "{"
      + JsonUtil.pair("_id", book.id) + ","
      + JsonUtil.pair("title", book.title) + ","
      + JsonUtil.pair("isbn", book.isbn) + ","
      + JsonUtil.pair("author", book.author) + ","
      + "\"category\":" + (category == null ? "null" : category(category)) + ","
      + JsonUtil.pair("categoryName", book.categoryName) + ","
      + JsonUtil.pair("course", book.course) + ","
      + JsonUtil.pair("department", book.department) + ","
      + "\"semester\":" + book.semester + ","
      + JsonUtil.pair("subjectCode", book.subjectCode) + ","
      + JsonUtil.pair("edition", book.edition) + ","
      + JsonUtil.pair("publisher", book.publisher) + ","
      + "\"publishedYear\":" + book.publishedYear + ","
      + JsonUtil.pair("language", book.language) + ","
      + "\"totalCopies\":" + book.totalCopies + ","
      + "\"availableCopies\":" + book.availableCopies + ","
      + JsonUtil.pair("shelfLocation", book.shelfLocation) + ","
      + JsonUtil.pair("description", book.description) + ","
      + "\"tags\":" + JsonUtil.array(book.tags, JsonUtil::json) + ","
      + JsonUtil.pair("createdAt", book.createdAt) + ","
      + JsonUtil.pair("updatedAt", book.updatedAt)
      + "}";
  }

  String record(BorrowRecord record) {
    return "{"
      + JsonUtil.pair("_id", record.id) + ","
      + "\"member\":" + nullableUser(store.findUser(record.memberId)) + ","
      + "\"book\":" + nullableBook(store.findBook(record.bookId)) + ","
      + "\"issuedBy\":" + nullableUser(store.findUser(record.issuedById)) + ","
      + "\"returnedTo\":" + nullableUser(store.findUser(record.returnedToId)) + ","
      + JsonUtil.pair("status", record.status) + ","
      + JsonUtil.pair("issueDate", record.issueDate) + ","
      + JsonUtil.pair("dueDate", record.dueDate) + ","
      + "\"returnDate\":" + (record.returnDate == null ? "null" : JsonUtil.json(record.returnDate)) + ","
      + "\"fine\":" + record.fine + ","
      + JsonUtil.pair("notes", record.notes) + ","
      + JsonUtil.pair("createdAt", record.createdAt) + ","
      + JsonUtil.pair("updatedAt", record.updatedAt)
      + "}";
  }

  String notification(Notification notification) {
    return "{"
      + JsonUtil.pair("_id", notification.id) + ","
      + JsonUtil.pair("user", notification.userId) + ","
      + JsonUtil.pair("type", notification.type) + ","
      + JsonUtil.pair("title", notification.title) + ","
      + JsonUtil.pair("message", notification.message) + ","
      + "\"isRead\":" + notification.read + ","
      + JsonUtil.pair("relatedBorrowRecord", notification.relatedBorrowRecord) + ","
      + "\"dueDate\":" + (notification.dueDate == null ? "null" : JsonUtil.json(notification.dueDate)) + ","
      + JsonUtil.pair("createdAt", notification.createdAt) + ","
      + JsonUtil.pair("updatedAt", notification.updatedAt)
      + "}";
  }

  private String nullableUser(User user) {
    return user == null ? "null" : user(user);
  }

  private String nullableBook(Book book) {
    return book == null ? "null" : book(book);
  }
}
