import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

class MemberController {
  private final LibraryDataStore store;
  private final SecurityService security;
  private final JsonViews views;

  MemberController(LibraryDataStore store, SecurityService security, JsonViews views) {
    this.store = store;
    this.security = security;
    this.views = views;
  }

  void members(HttpExchange exchange) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null || !security.requireLibrarian(exchange, user)) {
      return;
    }
    Map<String, String> query = RequestUtil.query(exchange);
    String search = query.getOrDefault("search", "").toLowerCase(Locale.ROOT);
    String status = query.getOrDefault("membershipStatus", "");
    List<User> rows = store.users().stream().filter(member -> "member".equals(member.role)).collect(Collectors.toList());
    if (!search.isBlank()) {
      rows = rows.stream().filter(member -> TextUtil.contains(member.name, search) || TextUtil.contains(member.email, search) || TextUtil.contains(member.studentId, search)).collect(Collectors.toList());
    }
    if (!status.isBlank()) {
      rows = rows.stream().filter(member -> member.membershipStatus.equals(status)).collect(Collectors.toList());
    }
    rows.sort(Comparator.comparing(member -> member.name));
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"results\":" + rows.size() + ",\"pagination\":{\"page\":1,\"limit\":100,\"total\":" + rows.size() + ",\"pages\":1},\"data\":{\"members\":" + JsonUtil.array(rows, views::user) + "}}");
  }

  void memberStatus(HttpExchange exchange, String memberId) throws IOException {
    User user = security.requireAuth(exchange);
    if (user == null || !security.requireLibrarian(exchange, user)) {
      return;
    }
    User member = store.findUser(memberId);
    if (member == null || !"member".equals(member.role)) {
      HttpResponses.sendError(exchange, 404, "Member not found.");
      return;
    }
    String requestBody = RequestUtil.body(exchange);
    member.membershipStatus = JsonUtil.jsonString(requestBody, "membershipStatus", member.membershipStatus);
    member.borrowLimit = JsonUtil.jsonInt(requestBody, "borrowLimit", member.borrowLimit);
    member.updatedAt = TimeUtil.now();
    HttpResponses.sendJson(exchange, 200, "{\"status\":\"success\",\"data\":{\"member\":" + views.user(member) + "}}");
  }
}
