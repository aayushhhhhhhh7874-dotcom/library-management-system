import java.awt.Desktop;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.file.Path;

public class StackShelfJavaServer {
  private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

  public static void main(String[] args) throws Exception {
    Path projectRoot = Path.of("").toAbsolutePath();
    if (projectRoot.getFileName() != null && "java-backend".equals(projectRoot.getFileName().toString())) {
      projectRoot = projectRoot.getParent();
    }

    LibraryDataStore store = new LibraryDataStore();
    new DemoDataSeeder(store).seed();

    SecurityService security = new SecurityService(store);
    StackShelfRouter router = new StackShelfRouter(store, security, projectRoot);

    HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
    server.createContext("/", router::route);
    server.setExecutor(null);
    server.start();

    String appUrl = "http://127.0.0.1:" + PORT;
    System.out.println("StackShelf Java backend running at " + appUrl);
    System.out.println("Frontend: " + appUrl);
    System.out.println("API health: " + appUrl + "/health");
    System.out.println("Demo accounts:");
    System.out.println("  Librarian: aayush.kr0804@gmail.com / " + SecurityService.DEMO_PASSWORD);
    System.out.println("  Student: member@example.com / " + SecurityService.DEMO_PASSWORD);
    System.out.println("  Overdue: late@example.com / " + SecurityService.DEMO_PASSWORD);

    if (args.length > 0 && "--open".equals(args[0])) {
      openBrowser(appUrl);
    }
  }

  private static void openBrowser(String url) {
    try {
      if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
        Desktop.getDesktop().browse(URI.create(url));
      }
    } catch (Exception error) {
      System.out.println("Open this URL in your browser: " + url);
    }
  }
}
