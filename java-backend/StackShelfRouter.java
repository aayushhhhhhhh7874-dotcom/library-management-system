import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.file.Path;

class StackShelfRouter {
  private final HealthController healthController;
  private final AuthController authController;
  private final CatalogController catalogController;
  private final BorrowController borrowController;
  private final NotificationController notificationController;
  private final MemberController memberController;
  private final ReportController reportController;
  private final StaticFileController staticFileController;

  StackShelfRouter(LibraryDataStore store, SecurityService security, Path projectRoot) {
    JsonViews views = new JsonViews(store);
    BorrowService borrowService = new BorrowService(store);

    this.healthController = new HealthController();
    this.authController = new AuthController(store, security, views);
    this.catalogController = new CatalogController(store, security, views);
    this.borrowController = new BorrowController(store, security, views, borrowService);
    this.notificationController = new NotificationController(store, security, views, borrowService);
    this.memberController = new MemberController(store, security, views);
    this.reportController = new ReportController(store, security, views, borrowService);
    this.staticFileController = new StaticFileController(projectRoot);
  }

  void route(HttpExchange exchange) throws IOException {
    HttpResponses.addCors(exchange);

    if ("OPTIONS".equals(exchange.getRequestMethod())) {
      HttpResponses.send(exchange, 204, "", "application/json; charset=utf-8");
      return;
    }

    String method = exchange.getRequestMethod();
    String path = exchange.getRequestURI().getPath();
    if (path.length() > 1 && path.endsWith("/")) {
      path = path.substring(0, path.length() - 1);
    }

    try {
      if ("GET".equals(method) && "/health".equals(path)) {
        healthController.health(exchange);
      } else if ("POST".equals(method) && "/api/v1/auth/login".equals(path)) {
        authController.login(exchange);
      } else if ("POST".equals(method) && "/api/v1/auth/register".equals(path)) {
        authController.register(exchange);
      } else if (("GET".equals(method) || "PATCH".equals(method)) && "/api/v1/auth/me".equals(path)) {
        authController.me(exchange);
      } else if ("GET".equals(method) && "/api/v1/categories".equals(path)) {
        catalogController.categories(exchange);
      } else if ("/api/v1/books".equals(path) && ("GET".equals(method) || "POST".equals(method))) {
        catalogController.books(exchange);
      } else if (path.startsWith("/api/v1/books/") && ("GET".equals(method) || "DELETE".equals(method))) {
        catalogController.bookById(exchange, RequestUtil.decode(path.substring("/api/v1/books/".length())));
      } else if ("GET".equals(method) && "/api/v1/borrows/history".equals(path)) {
        borrowController.history(exchange);
      } else if ("GET".equals(method) && "/api/v1/borrows/overdue".equals(path)) {
        borrowController.overdue(exchange);
      } else if (path.startsWith("/api/v1/borrows/availability/") && "GET".equals(method)) {
        borrowController.availability(exchange, RequestUtil.decode(path.substring("/api/v1/borrows/availability/".length())));
      } else if (path.startsWith("/api/v1/borrows/return/") && "PATCH".equals(method)) {
        borrowController.returnBook(exchange, RequestUtil.decode(path.substring("/api/v1/borrows/return/".length())));
      } else if (path.startsWith("/api/v1/borrows/") && "POST".equals(method)) {
        borrowController.borrow(exchange, RequestUtil.decode(path.substring("/api/v1/borrows/".length())));
      } else if ("GET".equals(method) && "/api/v1/notifications".equals(path)) {
        notificationController.notifications(exchange);
      } else if (path.startsWith("/api/v1/notifications/") && path.endsWith("/read") && "PATCH".equals(method)) {
        String id = path.substring("/api/v1/notifications/".length()).replaceAll("/read$", "");
        notificationController.readNotification(exchange, RequestUtil.decode(id));
      } else if ("GET".equals(method) && "/api/v1/members".equals(path)) {
        memberController.members(exchange);
      } else if (path.startsWith("/api/v1/members/") && path.endsWith("/status") && "PATCH".equals(method)) {
        String id = path.substring("/api/v1/members/".length()).replaceAll("/status$", "");
        memberController.memberStatus(exchange, RequestUtil.decode(id));
      } else if (path.startsWith("/api/v1/reports/") && "GET".equals(method)) {
        reportController.reports(exchange, path);
      } else if (path.startsWith("/api/")) {
        HttpResponses.sendError(exchange, 404, "API endpoint not found.");
      } else {
        staticFileController.serve(exchange, path);
      }
    } catch (Exception error) {
      String message = error.getMessage() == null ? "Unexpected server error." : error.getMessage();
      HttpResponses.sendError(exchange, 500, message);
    }
  }
}
