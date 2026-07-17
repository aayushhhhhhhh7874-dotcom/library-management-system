import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;

class HealthController {
  void health(HttpExchange exchange) throws IOException {
    HttpResponses.sendJson(exchange, 200, "{"
      + JsonUtil.pair("status", "success") + ","
      + JsonUtil.pair("timestamp", TimeUtil.now()) + ","
      + "\"database\":{\"status\":\"connected\",\"engine\":\"java-memory\",\"path\":\"JDK in-memory demo\"}"
      + "}");
  }
}
