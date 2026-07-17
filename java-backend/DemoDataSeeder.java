import java.util.List;
import java.util.Locale;

class DemoDataSeeder {
  private final LibraryDataStore store;

  DemoDataSeeder(LibraryDataStore store) {
    this.store = store;
  }

  void seed() {
    if (store.hasBooks()) {
      return;
    }

    String createdAt = TimeUtil.now();
    Subject[] subjects = {
      new Subject("Engineering Mathematics", "MA101", 1),
      new Subject("Programming in C", "CS101", 1),
      new Subject("Digital Logic Design", "CS102", 1),
      new Subject("Discrete Mathematics", "CS201", 2),
      new Subject("Data Structures", "CS202", 2),
      new Subject("Computer Organization", "CS203", 2),
      new Subject("Object Oriented Programming", "CS301", 3),
      new Subject("Database Management Systems", "CS302", 3),
      new Subject("Operating Systems", "CS303", 3),
      new Subject("Computer Networks", "CS401", 4),
      new Subject("Design and Analysis of Algorithms", "CS402", 4),
      new Subject("Software Engineering", "CS403", 4),
      new Subject("Theory of Computation", "CS501", 5),
      new Subject("Web Technologies", "CS502", 5),
      new Subject("Artificial Intelligence", "CS503", 5),
      new Subject("Machine Learning", "CS601", 6),
      new Subject("Compiler Design", "CS602", 6),
      new Subject("Cloud Computing", "CS603", 6),
      new Subject("Cyber Security", "CS701", 7),
      new Subject("Big Data Analytics", "CS702", 7),
      new Subject("Mobile Application Development", "CS703", 7),
      new Subject("Internet of Things", "CS801", 8),
      new Subject("Blockchain Technology", "CS802", 8),
      new Subject("DevOps Engineering", "CS803", 8),
      new Subject("Project Management", "CS804", 8)
    };
    String[] focusAreas = {
      "Foundations and Core Concepts",
      "Applied Techniques for Engineers",
      "Laboratory Manual and Experiments",
      "Interview and Placement Preparation",
      "Advanced Topics and Research Directions"
    };
    String[] authors = {
      "Aarav Sharma", "Ananya Iyer", "Rohan Saxena", "Meera Deshpande", "Ishaan Malhotra",
      "Nisha Verma", "Kabir Rao", "Diya Menon", "Aditya Nair", "Sanya Kapoor"
    };

    int counter = 1;
    for (int i = 0; i < subjects.length; i++) {
      Subject subject = subjects[i];
      Category category = new Category(
        "cat-" + TextUtil.pad(i + 1, 3),
        subject.name(),
        "BTech CSE semester " + subject.semester() + " resources for " + subject.name() + ".",
        createdAt
      );
      store.categories().add(category);

      for (int j = 1; j <= 40; j++) {
        String title = subject.name() + ": " + focusAreas[(j - 1) % focusAreas.length] + " - Volume " + (((j - 1) / 5) + 1);
        Book book = new Book();
        book.id = "book-" + TextUtil.pad(counter, 4);
        book.title = title;
        book.isbn = "97893" + TextUtil.pad(i + 1, 2) + TextUtil.pad(j, 2) + TextUtil.pad(counter, 4);
        book.author = authors[counter % authors.length];
        book.categoryId = category.id;
        book.categoryName = category.name;
        book.course = "BTech CSE";
        book.department = "Computer Science and Engineering";
        book.semester = subject.semester();
        book.subjectCode = subject.code();
        book.edition = "Edition " + ((j % 4) + 1);
        book.publisher = "Campus Computing Press";
        book.publishedYear = 2012 + (j % 13);
        book.language = "English";
        book.totalCopies = 4 + (j % 6);
        book.availableCopies = book.totalCopies;
        book.shelfLocation = "CSE-S" + subject.semester() + "-" + TextUtil.pad(j, 3);
        book.description = "Academic reference for " + subject.name() + " with examples, lab tasks, and exam preparation notes.";
        book.tags = List.of("btech cse", subject.name().toLowerCase(Locale.ROOT), subject.code().toLowerCase(Locale.ROOT));
        book.createdAt = createdAt;
        book.updatedAt = createdAt;
        store.books().add(book);
        counter++;
      }
    }

    store.users().add(new User("user-librarian", "Aayush Kumar", "aayush.kr0804@gmail.com", "librarian", "9876543210", "LIB2026001", 8, 2021, 20, createdAt));
    store.users().add(new User("user-member", "Aarav Sharma", "member@example.com", "member", "9876501234", "CSE2025001", 5, 2022, 5, createdAt));
    store.users().add(new User("user-late", "Nisha Verma", "late@example.com", "member", "9876509876", "CSE2025002", 6, 2021, 5, createdAt));

    store.books().get(0).availableCopies -= 1;
    store.books().get(1).availableCopies -= 1;
    store.borrowRecords().add(new BorrowRecord("borrow-active-1", "user-member", store.books().get(0).id, "user-librarian", "borrowed", TimeUtil.daysFromNow(-3), TimeUtil.daysFromNow(11), null, createdAt));
    store.borrowRecords().add(new BorrowRecord("borrow-overdue-1", "user-late", store.books().get(1).id, "user-librarian", "overdue", TimeUtil.daysFromNow(-21), TimeUtil.daysFromNow(-7), null, createdAt));

    store.notifications().add(new Notification("notification-active-1", "user-member", "borrow_confirmation", "Book borrowed", "You borrowed \"" + store.books().get(0).title + "\".", false, "borrow-active-1", TimeUtil.daysFromNow(11), TimeUtil.daysFromNow(-3)));
    store.notifications().add(new Notification("notification-overdue-1", "user-late", "overdue_alert", "Book overdue", "The book \"" + store.books().get(1).title + "\" is overdue.", false, "borrow-overdue-1", TimeUtil.daysFromNow(-7), TimeUtil.daysFromNow(-7)));
  }
}
