import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Locale;

final class HttpResponses {
  private HttpResponses() {
  }

  static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
    sendJson(exchange, statusCode, "{\"status\":\"error\",\"message\":" + JsonUtil.json(message) + "}");
  }

  static void sendJson(HttpExchange exchange, int statusCode, String json) throws IOException {
    send(exchange, statusCode, json, "application/json; charset=utf-8");
  }

  static void send(HttpExchange exchange, int statusCode, String body, String contentType) throws IOException {
    send(exchange, statusCode, body.getBytes(StandardCharsets.UTF_8), contentType);
  }

  static void send(HttpExchange exchange, int statusCode, byte[] body, String contentType) throws IOException {
    addCors(exchange);
    exchange.getResponseHeaders().set("Content-Type", contentType);
    exchange.sendResponseHeaders(statusCode, body.length);
    exchange.getResponseBody().write(body);
    exchange.close();
  }

  static void addCors(HttpExchange exchange) {
    exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
    exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  }

  static String contentType(Path file) {
    String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
    if (name.endsWith(".html")) return "text/html; charset=utf-8";
    if (name.endsWith(".css")) return "text/css; charset=utf-8";
    if (name.endsWith(".js")) return "text/javascript; charset=utf-8";
    if (name.endsWith(".json")) return "application/json; charset=utf-8";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".svg")) return "image/svg+xml";
    return "application/octet-stream";
  }
}
