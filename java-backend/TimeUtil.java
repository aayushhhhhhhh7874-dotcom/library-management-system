import java.time.Instant;
import java.time.temporal.ChronoUnit;

final class TimeUtil {
  private TimeUtil() {
  }

  static String now() {
    return Instant.now().truncatedTo(ChronoUnit.SECONDS).toString();
  }

  static String daysFromNow(int days) {
    return Instant.now().plus(days, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS).toString();
  }
}
