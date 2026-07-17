import java.util.List;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

final class JsonUtil {
  private JsonUtil() {
  }

  static String jsonString(String body, String key, String fallback) {
    Pattern pattern = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"((?:\\\\.|[^\"])*)\"");
    Matcher matcher = pattern.matcher(body == null ? "" : body);
    return matcher.find() ? unescape(matcher.group(1)) : fallback;
  }

  static int jsonInt(String body, String key, int fallback) {
    Pattern pattern = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?\\d+)");
    Matcher matcher = pattern.matcher(body == null ? "" : body);
    return matcher.find() ? TextUtil.parseInt(matcher.group(1), fallback) : fallback;
  }

  static String pagination(int page, int limit, int total, int pages) {
    return "{\"page\":" + page + ",\"limit\":" + limit + ",\"total\":" + total + ",\"pages\":" + pages + "}";
  }

  static <T> String array(List<T> rows, Function<T, String> mapper) {
    return rows.stream().map(mapper).collect(Collectors.joining(",", "[", "]"));
  }

  static String pair(String key, String value) {
    return json(key) + ":" + json(value);
  }

  static String json(String value) {
    if (value == null) {
      return "null";
    }
    return "\"" + value
      .replace("\\", "\\\\")
      .replace("\"", "\\\"")
      .replace("\n", "\\n")
      .replace("\r", "\\r")
      .replace("\t", "\\t")
      + "\"";
  }

  private static String unescape(String value) {
    return value
      .replace("\\\"", "\"")
      .replace("\\\\", "\\")
      .replace("\\n", "\n")
      .replace("\\r", "\r")
      .replace("\\t", "\t");
  }
}
