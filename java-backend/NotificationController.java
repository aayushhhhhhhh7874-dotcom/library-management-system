import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class NotificationController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;
  private final BorrowService borrowService;

  NotificationController(LibraryDataStore store, SecurityService security, JsonViews views, BorrowService borrowService) {
    this.store = store;
    this.security = security;
    this.views = views;
    this.borrowService = borrowService;
  }

  void notifications(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }
    borrowService.markOverdueRecords();
    Map<String, String> query = RequestUtil.query(exchange);
    String isRead = query.getOrDefault("isRead", "");
    List<Notification> rows = store.notifications().stream()
      .filter(notification -> "librarian".equals(user.role) || notification.userId.equals(user.id))
      .collect(Collectors.toList());
    if (!isRead.isBlank()) {
      boolean read = Boolean.parseBoolean(isRead);
      rows = rows.stream().filter(notification -> notification.read == read).collect(Collectors.toList());
    }
    rows.sort(Comparator.comparing((Notification notification) -> notification.createdAt).reversed());
    int page = Math.max(1, TextUtil.parseInt(query.getOrDefault("page", "1"), 1));
    int limit = Math.min(100, Math.max(1, TextUtil.parseInt(query.getOrDefault("limit", "20"), 20)));
    sendNotifications(exchange, rows, page, limit);
  }

  void readNotification(HttpExchange exchange, String notificationId) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }
    Notification notification = store.findNotification(notificationId);
    if (notification == null || ("member".equals(user.role) && !notification.userId.equals(user.id))) {
      HttpResponses.sendError(exchange, 404, "Notification not found.");
      return;
    }
    notification.read = true;
    notification.updatedAt = TimeUtil.now();
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"notification\":" + views.notification(notification) + "}}");
  }

  private void sendNotifications(HttpExchange exchange, List<Notification> rows, int page, int limit) throws IOException {
    int total = rows.size();
    int pages = Math.max(1, (int) Math.ceil(total / (double) limit));
    int start = Math.min(total, (page - 1) * limit);
    int end = Math.min(total, start + limit);
    List<Notification> pageRows = rows.subList(start, end);
    String pagination = JsonUtil.pagination(page, limit, total, pages);
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + pageRows.size() + ",\"pagination\":" + pagination + ",\"data\":{\"notifications\":" + JsonUtil.array(pageRows, views::notification) + "}}");
  }
}
