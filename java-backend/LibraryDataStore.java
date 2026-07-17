import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class LibraryDataStore {
  private final List<Category> categories = new ArrayList<>();
  private final List<Book> books = new ArrayList<>();
  private final List<User> users = new ArrayList<>();
  private final List<BorrowRecord> borrowRecords = new ArrayList<>();
  private final List<Notification> notifications = new ArrayList<>();

  List<Category> categories() {
    return categories;
  }

  List<Book> books() {
    return books;
  }

  List<User> users() {
    return users;
  }

  List<BorrowRecord> borrowRecords() {
    return borrowRecords;
  }

  List<Notification> notifications() {
    return notifications;
  }

  boolean hasBooks() {
    return !books.isEmpty();
  }

  User findUser(String id) {
    return users.stream().filter(user -> user.id.equals(id)).findFirst().orElse(null);
  }

  User findUserByEmail(String email) {
    return users.stream().filter(user -> user.email.equalsIgnoreCase(email)).findFirst().orElse(null);
  }

  User findMemberByStudentId(String studentId) {
    return users.stream()
      .filter(user -> "member".equals(user.role) && user.studentId != null && user.studentId.equalsIgnoreCase(studentId))
      .findFirst()
      .orElse(null);
  }

  Book findBook(String id) {
    return books.stream().filter(book -> book.id.equals(id)).findFirst().orElse(null);
  }

  Category findCategory(String id) {
    return categories.stream().filter(category -> category.id.equals(id)).findFirst().orElse(null);
  }

  BorrowRecord findBorrowRecord(String id) {
    return borrowRecords.stream().filter(record -> record.id.equals(id)).findFirst().orElse(null);
  }

  Notification findNotification(String id) {
    return notifications.stream().filter(notification -> notification.id.equals(id)).findFirst().orElse(null);
  }

  void sortBooks(List<Book> rows, String sort) {
    if ("-publishedYear".equals(sort)) {
      rows.sort(Comparator.comparingInt((Book book) -> book.publishedYear).reversed());
    } else if ("-availableCopies".equals(sort)) {
      rows.sort(Comparator.comparingInt((Book book) -> book.availableCopies).reversed());
    } else {
      rows.sort(Comparator.comparing(book -> book.title));
    }
  }
}
