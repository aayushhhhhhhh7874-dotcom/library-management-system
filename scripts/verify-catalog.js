const assert = require("assert");
const {
  CSE_SUBJECTS,
  buildCseBookCatalog
} = require("../src/data/cseBookCatalog");

const books = buildCseBookCatalog();
const titles = new Set(books.map((book) => book.title));
const isbns = new Set(books.map((book) => book.isbn));

assert.strictEqual(CSE_SUBJECTS.length, 25, "Expected 25 CSE subject categories.");
assert.strictEqual(books.length, 1000, "Expected exactly 1,000 books.");
assert.strictEqual(titles.size, 1000, "Every book title must be unique.");
assert.strictEqual(isbns.size, 1000, "Every ISBN must be unique.");
assert.ok(books.every((book) => /^\d{13}$/.test(book.isbn)), "Every ISBN must contain 13 digits.");
assert.ok(books.every((book) => book.semester >= 1 && book.semester <= 8), "Every book needs a valid semester.");
assert.ok(books.every((book) => book.course === "BTech CSE"), "Every book must belong to BTech CSE.");

console.log("Catalog verification passed: 1,000 unique BTech CSE books across 25 subjects.");
