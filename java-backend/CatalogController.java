import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

class CatalogController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;

  CatalogController(LibraryDataStore store, SecurityService security, JsonViews views) {
    this.store = store;
    this.security = security;
    this.views = views;
  }

  void categories(HttpExchange exchange) throws IOException {
    String rows = JsonUtil.array(store.categories(), views::category);
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + store.categories().size() + ",\"data\":{\"categories\":" + rows + "}}");
  }

  void books(HttpExchange exchange) throws IOException {
    if ("POST".equals(exchange.getRequestMethod())) {
      createBook(exchange);
      return;
    }

    Map<String, String> query = RequestUtil.query(exchange);
    List<Book> rows = new ArrayList<>(store.books());
    String search = query.getOrDefault("search", "").toLowerCase(Locale.ROOT);
    String category = query.getOrDefault("category", "");
    String availability = query.getOrDefault("availability", "");
    String semester = query.getOrDefault("semester", "");
    String sort = query.getOrDefault("sort", "title");

    if (!search.isBlank()) {
      rows = rows.stream()
        .filter(book -> TextUtil.contains(book.title, search) || TextUtil.contains(book.author, search) || TextUtil.contains(book.isbn, search) || TextUtil.contains(book.subjectCode, search) || TextUtil.contains(book.publisher, search))
        .collect(Collectors.toList());
    }
    if (!category.isBlank()) {
      rows = rows.stream().filter(book -> book.categoryId.equals(category) || book.categoryName.equalsIgnoreCase(category)).collect(Collectors.toList());
    }
    if (!semester.isBlank()) {
      int value = TextUtil.parseInt(semester, 0);
      rows = rows.stream().filter(book -> book.semester == value).collect(Collectors.toList());
    }
    if ("available".equals(availability)) {
      rows = rows.stream().filter(book -> book.availableCopies > 0).collect(Collectors.toList());
    }
    if ("unavailable".equals(availability)) {
      rows = rows.stream().filter(book -> book.availableCopies <= 0).collect(Collectors.toList());
    }

    store.sortBooks(rows, sort);
    int page = Math.max(1, TextUtil.parseInt(query.getOrDefault("page", "1"), 1));
    int limit = Math.min(100, Math.max(1, TextUtil.parseInt(query.getOrDefault("limit", "20"), 20)));
    sendBooks(exchange, rows, page, limit);
  }

  void bookById(HttpExchange exchange, String id) throws IOException {
    Book book = store.findBook(id);
    if (book == null) {
      HttpResponses.sendError(exchange, 404, "Book not found.");
      return;
    }

    if ("DELETE".equals(exchange.getRequestMethod())) {
      User user = security.requireAuth(exchange);
      if (user == null || !security.requireLibrarian(exchange, user)) {
        return;
      }
      store.books().remove(book);
      HttpResponses.send(exchange, 204, "", "application/json; charset=utf-8");
      return;
    }

    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"book\":" + views.book(book) + "}}");
  }

  private void createBook(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null || !security.requireLibrarian(exchange, user)) {
      return;
    }

    String body = RequestUtil.body(exchange);
    String categoryId = JsonUtil.jsonString(body, "category", store.categories().get(0).id);
    Category category = store.findCategory(categoryId);
    if (category == null) {
      HttpResponses.sendError(exchange, 400, "Subject category is required.");
      return;
    }

    Book book = new Book();
    book.id = "book-" + UUID.randomUUID();
    book.title = JsonUtil.jsonString(body, "title", "");
    book.isbn = JsonUtil.jsonString(body, "isbn", "97893" + System.currentTimeMillis());
    book.author = JsonUtil.jsonString(body, "author", "");
    book.categoryId = category.id;
    book.categoryName = category.name;
    book.course = JsonUtil.jsonString(body, "course", "BTech CSE");
    book.department = "Computer Science and Engineering";
    book.semester = JsonUtil.jsonInt(body, "semester", 1);
    book.subjectCode = JsonUtil.jsonString(body, "subjectCode", "CSE");
    book.edition = JsonUtil.jsonString(body, "edition", "Reference Edition");
    book.publisher = JsonUtil.jsonString(body, "publisher", "Campus Computing Press");
    book.publishedYear = JsonUtil.jsonInt(body, "publishedYear", 2026);
    book.language = "English";
    book.totalCopies = Math.max(1, JsonUtil.jsonInt(body, "totalCopies", 1));
    book.availableCopies = book.totalCopies;
    book.shelfLocation = JsonUtil.jsonString(body, "shelfLocation", "CSE-NEW");
    book.description = JsonUtil.jsonString(body, "description", "");
    book.tags = List.of("btech cse", book.subjectCode.toLowerCase(Locale.ROOT));
    book.createdAt = TimeUtil.now();
    book.updatedAt = book.createdAt;

    if (book.title.isBlank() || book.author.isBlank()) {
      HttpResponses.sendError(exchange, 400, "Title, author, and subject are required.");
      return;
    }

    store.books().add(book);
    HttpResponses.sendJson(exchange, 201, "{\"status\":\"success\",\"data\":{\"book\":" + views.book(book) + "}}");
  }

  private void sendBooks(HttpExchange exchange, List<Book> rows, int page, int limit) throws IOException {
    int total = rows.size();
    int pages = Math.max(1, (int) Math.ceil(total / (double) limit));
    int start = Math.min(total, (page - 1) * limit);
    int end = Math.min(total, start + limit);
    List<Book> pageRows = rows.subList(start, end);
    String pagination = JsonUtil.pagination(page, limit, total, pages);
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + pageRows.size() + ",\"pagination\":" + pagination + ",\"data\":{\"books\":" + JsonUtil.array(pageRows, views::book) + "}}");
  }
}
