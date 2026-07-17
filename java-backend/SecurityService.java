import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

class SecurityService {
  static final String DEMO_PASSWORD = "Password@123";

  private final LibraryDataStore store;

  SecurityService(LibraryDataStore store) {
    this.store = store;
  }

  User requireAuth(HttpExchange exchange) throws IOException {
    User user = currentUser(exchange);
    if (user == null) {
      HttpResponses.sendError(exchange, 401, "Please sign in to continue.");
    }
    return user;
  }

  boolean requireLibrarian(HttpExchange exchange, User user) throws IOException {
    if (!"librarian".equals(user.role)) {
      HttpResponses.sendError(exchange, 403, "This action is only available to librarians.");
      return false;
    }
    return true;
  }

  String createToken(User user) {
    String token = user.id + ":" + System.currentTimeMillis();
    return Base64.getUrlEncoder().withoutPadding().encodeToString(token.getBytes(StandardCharsets.UTF_8));
  }

  private User currentUser(HttpExchange exchange) {
    String authorization = exchange.getRequestHeaders().getFirst("Authorization");
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      return null;
    }
    try {
      String token = authorization.substring("Bearer ".length());
      String decoded = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
      String userId = decoded.split(":", 2)[0];
      return store.findUser(userId);
    } catch (Exception error) {
      return null;
    }
  }
}
