import java.time.Instant;
import java.util.UUID;

class BorrowService {
  private final LibraryDataStore store;

  BorrowService(LibraryDataStore store) {
    this.store = store;
  }

  void markOverdueRecords() {
    Instant current = Instant.now();
    for (BorrowRecord record : store.borrowRecords()) {
      if ("borrowed".equals(record.status) && Instant.parse(record.dueDate).isBefore(current)) {
        record.status = "overdue";
        record.updatedAt = TimeUtil.now();
        boolean exists = store.notifications().stream()
          .anyMatch(notification -> "overdue_alert".equals(notification.type) && record.id.equals(notification.relatedBorrowRecord));
        if (!exists) {
          Book book = store.findBook(record.bookId);
          String title = book == null ? "borrowed book" : book.title;
          store.notifications().add(new Notification("notification-" + UUID.randomUUID(), record.memberId, "overdue_alert", "Book overdue", "The book \"" + title + "\" is overdue.", false, record.id, record.dueDate, TimeUtil.now()));
        }
      }
    }
  }
}
