import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

class BorrowController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;
  private final BorrowService borrowService;

  BorrowController(LibraryDataStore store, SecurityService security, JsonViews views, BorrowService borrowService) {
    this.store = store;
    this.security = security;
    this.views = views;
    this.borrowService = borrowService;
  }

  void borrow(HttpExchange exchange, String bookId) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }

    String requestBody = RequestUtil.body(exchange);
    User member = "librarian".equals(user.role)
      ? resolveIssueMember(exchange, requestBody)
      : user;
    Book book = store.findBook(bookId);

    if (member == null) {
      return;
    }

    if (member == null || !"member".equals(member.role)) {
      HttpResponses.sendError(exchange, 404, "Member not found.");
      return;
    }
    if (!"active".equals(member.membershipStatus)) {
      HttpResponses.sendError(exchange, 403, "Only active members can borrow books.");
      return;
    }
    if (book == null) {
      HttpResponses.sendError(exchange, 404, "Book not found.");
      return;
    }
    if (book.availableCopies < 1) {
      HttpResponses.sendError(exchange, 400, "This book is currently unavailable.");
      return;
    }

    BorrowRecord record = new BorrowRecord("borrow-" + UUID.randomUUID(), member.id, book.id, user.id, "borrowed", TimeUtil.now(), TimeUtil.daysFromNow(14), null, TimeUtil.now());
    record.notes = JsonUtil.jsonString(requestBody, "notes", "");
    store.borrowRecords().add(record);
    book.availableCopies -= 1;
    book.updatedAt = TimeUtil.now();
    store.notifications().add(new Notification("notification-" + UUID.randomUUID(), member.id, "borrow_confirmation", "Book borrowed", "You borrowed \"" + book.title + "\".", false, record.id, record.dueDate, TimeUtil.now()));

    HttpResponses.sendJson(exchange, 201, "{\"status\":\"success\",\"data\":{\"borrowRecord\":" + views.record(record) + "}}");
  }

  private User resolveIssueMember(HttpExchange exchange, String requestBody) throws IOException {
    String memberId = JsonUtil.jsonString(requestBody, "memberId", "");
    if (!memberId.isBlank()) {
      User member = store.findUser(memberId);
      if (member == null || !"member".equals(member.role)) {
        HttpResponses.sendError(exchange, 404, "Member not found.");
        return null;
      }
      return member;
    }

    String studentId = JsonUtil.jsonString(requestBody, "studentId", "").trim().toUpperCase(Locale.ROOT);
    String memberName = JsonUtil.jsonString(requestBody, "memberName", "").trim();
    String email = JsonUtil.jsonString(requestBody, "email", "").trim().toLowerCase(Locale.ROOT);

    if (studentId.isBlank() || memberName.isBlank()) {
      HttpResponses.sendError(exchange, 400, "Student name and student ID are required to issue books.");
      return null;
    }

    User existingByStudentId = store.findMemberByStudentId(studentId);
    if (existingByStudentId != null) {
      return existingByStudentId;
    }

    if (!email.isBlank()) {
      User existingByEmail = store.findUserByEmail(email);
      if (existingByEmail != null) {
        if (!"member".equals(existingByEmail.role)) {
          HttpResponses.sendError(exchange, 409, "Email is already used by another account.");
          return null;
        }
        return existingByEmail;
      }
    } else {
      email = studentId.toLowerCase(Locale.ROOT) + "@stackshelf.local";
    }

    User member = new User(
      "user-" + UUID.randomUUID(),
      memberName,
      email,
      "member",
      JsonUtil.jsonString(requestBody, "phone", ""),
      studentId,
      JsonUtil.jsonInt(requestBody, "semester", 1),
      JsonUtil.jsonInt(requestBody, "enrollmentYear", 2026),
      5,
      TimeUtil.now()
    );
    store.users().add(member);
    store.notifications().add(new Notification("notification-" + UUID.randomUUID(), member.id, "welcome", "Welcome to StackShelf", "Your member account was created at the issue desk.", false, "", null, TimeUtil.now()));
    return member;
  }

  void returnBook(HttpExchange exchange, String recordId) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }

    BorrowRecord record = store.findBorrowRecord(recordId);
    if (record == null) {
      HttpResponses.sendError(exchange, 404, "Borrow record not found.");
      return;
    }
    if ("member".equals(user.role) && !record.memberId.equals(user.id)) {
      HttpResponses.sendError(exchange, 403, "Members can only return their own borrowed books.");
      return;
    }
    if ("returned".equals(record.status)) {
      HttpResponses.sendError(exchange, 400, "This book has already been returned.");
      return;
    }

    Book book = store.findBook(record.bookId);
    record.status = "returned";
    record.returnDate = TimeUtil.now();
    record.returnedToId = "librarian".equals(user.role) ? user.id : "";
    record.updatedAt = TimeUtil.now();
    if (book != null) {
      book.availableCopies += 1;
      book.updatedAt = TimeUtil.now();
    }
    store.notifications().add(new Notification("notification-" + UUID.randomUUID(), record.memberId, "return_confirmation", "Book returned", "You returned \"" + (book == null ? "the book" : book.title) + "\".", false, record.id, null, TimeUtil.now()));

    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"borrowRecord\":" + views.record(record) + "}}");
  }

  void history(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }

    borrowService.markOverdueRecords();
    Map<String, String> query = RequestUtil.query(exchange);
    String status = query.getOrDefault("status", "");
    List<BorrowRecord> rows = new ArrayList<>(store.borrowRecords());
    if ("member".equals(user.role)) {
      rows = rows.stream().filter(record -> record.memberId.equals(user.id)).collect(Collectors.toList());
    }
    if (!status.isBlank()) {
      rows = rows.stream().filter(record -> record.status.equals(status)).collect(Collectors.toList());
    }
    rows.sort(Comparator.comparing((BorrowRecord record) -> record.createdAt).reversed());
    int page = Math.max(1, TextUtil.parseInt(query.getOrDefault("page", "1"), 1));
    int limit = Math.min(100, Math.max(1, TextUtil.parseInt(query.getOrDefault("limit", "20"), 20)));
    sendRecords(exchange, rows, page, limit);
  }

  void overdue(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null || !security.requireLibrarian(exchange, user)) {
      return;
    }
    borrowService.markOverdueRecords();
    List<BorrowRecord> rows = store.borrowRecords().stream().filter(record -> "overdue".equals(record.status)).collect(Collectors.toList());
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + rows.size() + ",\"data\":{\"records\":" + JsonUtil.array(rows, views::record) + "}}");
  }

  void availability(HttpExchange exchange, String bookId) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }
    Book book = store.findBook(bookId);
    if (book == null) {
      HttpResponses.sendError(exchange, 404, "Book not found.");
      return;
    }
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"bookId\":" + JsonUtil.json(book.id) + ",\"title\":" + JsonUtil.json(book.title) + ",\"totalCopies\":" + book.totalCopies + ",\"availableCopies\":" + book.availableCopies + ",\"isAvailable\":" + (book.availableCopies > 0) + "}}");
  }

  private void sendRecords(HttpExchange exchange, List<BorrowRecord> rows, int page, int limit) throws IOException {
    int total = rows.size();
    int pages = Math.max(1, (int) Math.ceil(total / (double) limit));
    int start = Math.min(total, (page - 1) * limit);
    int end = Math.min(total, start + limit);
    List<BorrowRecord> pageRows = rows.subList(start, end);
    String pagination = JsonUtil.pagination(page, limit, total, pages);
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + pageRows.size() + ",\"pagination\":" + pagination + ",\"data\":{\"records\":" + JsonUtil.array(pageRows, views::record) + "}}");
  }
}
