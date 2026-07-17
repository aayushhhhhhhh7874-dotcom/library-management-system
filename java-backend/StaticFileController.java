import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

class StaticFileController {
  private final Path projectRoot;

  StaticFileController(Path projectRoot) {
    this.projectRoot = projectRoot;
  }

  void serve(HttpExchange exchange, String path) throws IOException {
    Path frontendRoot = projectRoot.resolve("frontend").normalize();
    Path requested = frontendRoot.resolve(".".equals(path) || "/".equals(path) ? "index.html" : path.substring(1)).normalize();

    if (!requested.startsWith(frontendRoot)) {
      HttpResponses.sendError(exchange, 403, "Forbidden.");
      return;
    }

    if (!Files.exists(requested) || Files.isDirectory(requested)) {
      requested = frontendRoot.resolve("index.html");
    }

    if (!Files.exists(requested)) {
      HttpResponses.sendError(exchange, 404, "Frontend files not found.");
      return;
    }

    HttpResponses.send(exchange, 200, Files.readAllBytes(requested), HttpResponses.contentType(requested));
  }
}
