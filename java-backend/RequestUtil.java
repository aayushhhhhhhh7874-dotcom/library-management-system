import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

final class RequestUtil {
  private RequestUtil() {
  }

  static Map<String, String> query(HttpExchange exchange) {
    Map<String, String> values = new HashMap<>();
    String raw = exchange.getRequestURI().getRawQuery();
    if (raw == null || raw.isBlank()) {
      return values;
    }
    for (String pair : raw.split("&")) {
      String[] parts = pair.split("=", 2);
      values.put(decode(parts[0]), parts.length > 1 ? decode(parts[1]) : "");
    }
    return values;
  }

  static String body(HttpExchange exchange) throws IOException {
    return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
  }

  static String decode(String value) {
    return URLDecoder.decode(value, StandardCharsets.UTF_8);
  }
}
