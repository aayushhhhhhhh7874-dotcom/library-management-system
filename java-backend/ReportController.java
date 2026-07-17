import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class ReportController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;
  private final BorrowService borrowService;

  ReportController(LibraryDataStore store, SecurityService security, JsonViews views, BorrowService borrowService) {
    this.store = store;
    this.security = security;
    this.views = views;
    this.borrowService = borrowService;
  }

  void reports(HttpExchange exchange, String path) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null || !security.requireLibrarian(exchange, user)) {
      return;
    }
    borrowService.markOverdueRecords();

    if ("/api/v1/reports/inventory-status".equals(path)) {
      inventoryStatus(exchange);
      return;
    }

    if ("/api/v1/reports/most-borrowed-books".equals(path)) {
      mostBorrowedBooks(exchange);
      return;
    }

    if ("/api/v1/reports/active-members".equals(path)) {
      activeMembers(exchange);
      return;
    }

    if ("/api/v1/reports/overdue-records".equals(path)) {
      overdueRecords(exchange);
      return;
    }

    HttpResponses.sendError(exchange, 404, "Report not found.");
  }

  private void inventoryStatus(HttpExchange exchange) throws IOException {
    int totalTitles = store.books().size();
    int totalCopies = store.books().stream().mapToInt(book -> book.totalCopies).sum();
    int availableCopies = store.books().stream().mapToInt(book -> book.availableCopies).sum();
    String categoryRows = JsonUtil.array(store.categories(), category -> {
      List<Book> categoryBooks = store.books().stream().filter(book -> book.categoryId.equals(category.id)).collect(Collectors.toList());
      int copies = categoryBooks.stream().mapToInt(book -> book.totalCopies).sum();
      int available = categoryBooks.stream().mapToInt(book -> book.availableCopies).sum();
      return "{\"categoryId\":" + JsonUtil.json(category.id) + ",\"category\":" + JsonUtil.json(category.name) + ",\"titles\":" + categoryBooks.size() + ",\"totalCopies\":" + copies + ",\"availableCopies\":" + available + ",\"borrowedCopies\":" + (copies - available) + "}";
    });
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"summary\":{\"totalTitles\":" + totalTitles + ",\"totalCopies\":" + totalCopies + ",\"availableCopies\":" + availableCopies + ",\"borrowedCopies\":" + (totalCopies - availableCopies) + "},\"categories\":" + categoryRows + "}}");
  }

  private void mostBorrowedBooks(HttpExchange exchange) throws IOException {
    Map<String, Long> counts = store.borrowRecords().stream().collect(Collectors.groupingBy(record -> record.bookId, Collectors.counting()));
    List<Book> ranked = store.books().stream()
      .filter(book -> counts.containsKey(book.id))
      .sorted((left, right) -> Long.compare(counts.get(right.id), counts.get(left.id)))
      .limit(10)
      .collect(Collectors.toList());
    String rows = JsonUtil.array(ranked, book -> {
      long count = counts.getOrDefault(book.id, 0L);
      return views.book(book).replaceFirst("\\}$", ",\"bookId\":" + JsonUtil.json(book.id) + ",\"borrowCount\":" + count + "}");
    });
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"books\":" + rows + "}}");
  }

  private void activeMembers(HttpExchange exchange) throws IOException {
    List<User> members = store.users().stream().filter(member -> "member".equals(member.role)).collect(Collectors.toList());
    String rows = JsonUtil.array(members, member -> {
      long total = store.borrowRecords().stream().filter(record -> record.memberId.equals(member.id)).count();
      long active = store.borrowRecords().stream().filter(record -> record.memberId.equals(member.id) && !"returned".equals(record.status)).count();
      return views.user(member).replaceFirst("\\}$", ",\"totalBorrows\":" + total + ",\"activeBorrows\":" + active + "}");
    });
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"members\":" + rows + "}}");
  }

  private void overdueRecords(HttpExchange exchange) throws IOException {
    List<BorrowRecord> rows = store.borrowRecords().stream().filter(record -> "overdue".equals(record.status)).collect(Collectors.toList());
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + rows.size() + ",\"data\":{\"records\":" + JsonUtil.array(rows, views::record) + "}}");
  }
}
