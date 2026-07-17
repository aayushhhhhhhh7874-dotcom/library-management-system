class User {
  String id;
  String name;
  String email;
  String role;
  String phone;
  String address = "";
  String studentId;
  String department = "Computer Science and Engineering";
  int semester;
  int enrollmentYear;
  String membershipStatus = "active";
  int borrowLimit;
  String createdAt;
  String updatedAt;

  User(String id, String name, String email, String role, String phone, String studentId, int semester, int enrollmentYear, int borrowLimit, String createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.phone = phone;
    this.studentId = studentId;
    this.semester = semester;
    this.enrollmentYear = enrollmentYear;
    this.borrowLimit = borrowLimit;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }
}
