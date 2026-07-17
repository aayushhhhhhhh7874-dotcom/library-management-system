import java.util.Locale;

final class TextUtil {
  private TextUtil() {
  }

  static boolean contains(String value, String search) {
    return value != null && value.toLowerCase(Locale.ROOT).contains(search);
  }

  static int parseInt(String value, int fallback) {
    try {
      return Integer.parseInt(value);
    } catch (Exception error) {
      return fallback;
    }
  }

  static String pad(int value, int size) {
    return String.format("%0" + size + "d", value);
  }
}
