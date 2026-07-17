import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

class AuthController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;

  AuthController(LibraryDataStore store, SecurityService security, JsonViews views) {
    this.store = store;
    this.security = security;
    this.views = views;
  }

  void login(HttpExchange exchange) throws IOException {
    String body = RequestUtil.body(exchange);
    String email = JsonUtil.jsonString(body, "email", "").toLowerCase(Locale.ROOT);
    String password = JsonUtil.jsonString(body, "password", "");
    User user = store.findUserByEmail(email);

    if (user == null || !SecurityService.DEMO_PASSWORD.equals(password)) {
      HttpResponses.sendError(exchange, 401, "Invalid email or password.");
      return;
    }

    HttpResponses.sendJson(exchange, 200, authResponse(user));
  }

  void register(HttpExchange exchange) throws IOException {
    String body = RequestUtil.body(exchange);
    String email = JsonUtil.jsonString(body, "email", "").toLowerCase(Locale.ROOT);
    String name = JsonUtil.jsonString(body, "name", "");

    if (name.isBlank() || email.isBlank() || JsonUtil.jsonString(body, "password", "").length() < 8) {
      HttpResponses.sendError(exchange, 400, "Name, email, and a password of at least 8 characters are required.");
      return;
    }

    if (store.findUserByEmail(email) != null) {
      HttpResponses.sendError(exchange, 409, "Email is already registered.");
      return;
    }

    String studentId = JsonUtil.jsonString(body, "studentId", "").toUpperCase(Locale.ROOT);
    if (!studentId.isBlank() && store.users().stream().anyMatch(user -> studentId.equals(user.studentId))) {
      HttpResponses.sendError(exchange, 409, "Student ID is already registered.");
      return;
    }

    User user = new User(
      "user-" + UUID.randomUUID(),
      name,
      email,
      "member",
      JsonUtil.jsonString(body, "phone", ""),
      studentId,
      JsonUtil.jsonInt(body, "semester", 1),
      JsonUtil.jsonInt(body, "enrollmentYear", 2026),
      5,
      TimeUtil.now()
    );
    store.users().add(user);
    store.notifications().add(new Notification("notification-" + UUID.randomUUID(), user.id, "welcome", "Welcome to StackShelf", "Your member account has been created in the Java backend.", false, "", null, TimeUtil.now()));

    HttpResponses.sendJson(exchange, 201, authResponse(user));
  }

  void me(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null) {
      return;
    }

    if ("PATCH".equals(exchange.getRequestMethod())) {
      String body = RequestUtil.body(exchange);
      user.name = JsonUtil.jsonString(body, "name", user.name);
      user.phone = JsonUtil.jsonString(body, "phone", user.phone);
      user.address = JsonUtil.jsonString(body, "address", user.address);
      user.department = JsonUtil.jsonString(body, "department", user.department);
      user.semester = JsonUtil.jsonInt(body, "semester", user.semester);
      user.updatedAt = TimeUtil.now();
    }

    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"user\":" + views.user(user) + "}}");
  }

  private String authResponse(User user) {
    return "{\"status\":\"success\",\"token\":" + JsonUtil.json(security.createToken(user)) + ",\"data\":{\"user\":" + views.user(user) + "}}";
  }
}
