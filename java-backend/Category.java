class Category {
  String id;
  String name;
  String description;
  String createdAt;
  String updatedAt;

  Category(String id, String name, String description, String createdAt) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = createdAt;
  }
}
