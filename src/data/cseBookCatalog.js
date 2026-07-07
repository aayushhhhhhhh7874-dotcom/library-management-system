const CSE_SUBJECTS = [
  { name: "Engineering Mathematics", code: "MA101", semester: 1, keywords: ["calculus", "linear algebra", "probability"] },
  { name: "Discrete Mathematics", code: "CS102", semester: 1, keywords: ["logic", "sets", "combinatorics"] },
  { name: "Engineering Physics", code: "PH103", semester: 1, keywords: ["semiconductors", "optics", "quantum physics"] },
  { name: "Engineering Chemistry", code: "CH104", semester: 1, keywords: ["materials", "polymers", "electrochemistry"] },
  { name: "Basic Electrical Engineering", code: "EE105", semester: 1, keywords: ["circuits", "machines", "measurements"] },
  { name: "Programming in C", code: "CS201", semester: 2, keywords: ["c programming", "pointers", "problem solving"] },
  { name: "Digital Logic Design", code: "CS202", semester: 2, keywords: ["boolean algebra", "digital circuits", "logic gates"] },
  { name: "Object-Oriented Programming", code: "CS203", semester: 2, keywords: ["java", "classes", "design patterns"] },
  { name: "Data Structures", code: "CS301", semester: 3, keywords: ["trees", "graphs", "hashing"] },
  { name: "Design and Analysis of Algorithms", code: "CS302", semester: 3, keywords: ["algorithms", "complexity", "dynamic programming"] },
  { name: "Computer Organization and Architecture", code: "CS303", semester: 3, keywords: ["processors", "memory", "instruction sets"] },
  { name: "Operating Systems", code: "CS401", semester: 4, keywords: ["processes", "memory management", "file systems"] },
  { name: "Database Management Systems", code: "CS402", semester: 4, keywords: ["sql", "normalization", "transactions"] },
  { name: "Computer Networks", code: "CS403", semester: 4, keywords: ["tcp ip", "routing", "network protocols"] },
  { name: "Software Engineering", code: "CS501", semester: 5, keywords: ["software design", "testing", "agile"] },
  { name: "Theory of Computation", code: "CS502", semester: 5, keywords: ["automata", "formal languages", "computability"] },
  { name: "Compiler Design", code: "CS503", semester: 5, keywords: ["parsing", "code generation", "optimization"] },
  { name: "Web Technologies", code: "CS504", semester: 5, keywords: ["html", "javascript", "web development"] },
  { name: "Artificial Intelligence", code: "CS601", semester: 6, keywords: ["search", "knowledge representation", "intelligent systems"] },
  { name: "Machine Learning", code: "CS602", semester: 6, keywords: ["supervised learning", "neural networks", "model evaluation"] },
  { name: "Data Science", code: "CS603", semester: 6, keywords: ["analytics", "visualization", "statistics"] },
  { name: "Cloud Computing", code: "CS701", semester: 7, keywords: ["distributed systems", "containers", "cloud architecture"] },
  { name: "Cyber Security", code: "CS702", semester: 7, keywords: ["cryptography", "network security", "ethical hacking"] },
  { name: "Internet of Things", code: "CS703", semester: 7, keywords: ["sensors", "embedded systems", "iot protocols"] },
  { name: "Mobile Application Development", code: "CS801", semester: 8, keywords: ["android", "mobile ui", "app architecture"] }
];

const FOCUS_AREAS = [
  "Foundations and Core Concepts",
  "Problem Solving with Worked Examples",
  "Design Principles and Best Practices",
  "Laboratory Manual and Experiments",
  "Applied Techniques for Engineers",
  "Advanced Topics and Research Directions",
  "University Exam Companion",
  "Interview and Placement Preparation",
  "Case Studies and Industry Applications",
  "Project-Based Learning"
];

const BOOK_FORMATS = [
  "Essential Guide",
  "Theory and Practice",
  "Problems and Solutions",
  "Hands-On Workbook"
];

const AUTHORS = [
  "Aarav Mehta", "Aditi Rao", "Akash Verma", "Ananya Iyer", "Arjun Nair",
  "Bhavna Kapoor", "Chetan Kulkarni", "Deepa Menon", "Devansh Shah", "Divya Bansal",
  "Farhan Ali", "Gaurav Joshi", "Harini Krishnan", "Ishaan Malhotra", "Jaya Srinivasan",
  "Karan Singhal", "Kavya Reddy", "Manish Tiwari", "Meera Deshpande", "Mohit Agarwal",
  "Nandini Bose", "Neeraj Kumar", "Nikhil Chandra", "Pallavi Sinha", "Pranav Gupta",
  "Priya Narayanan", "Rahul Bhat", "Ritika Jain", "Rohan Saxena", "Sakshi Arora",
  "Sameer Khanna", "Shalini Pillai", "Siddharth Das", "Sneha Patil", "Suresh Rangan",
  "Tanvi Mishra", "Varun Goyal", "Vikram Rao", "Yash Thakur", "Zoya Mirza"
];

const PUBLISHERS = [
  "TechEdge Academic",
  "Campus Computing Press",
  "Scholars India",
  "Engineering Pathways",
  "CodeCraft Publications",
  "University Learning House",
  "NextGen Technical Press",
  "Knowledge Grid",
  "CSE Reference Works",
  "Professional Study Press"
];

const createIsbn13 = (index) => {
  const firstTwelve = `97893${String(1000000 + index).slice(-7)}`;
  const weightedTotal = firstTwelve
    .split("")
    .reduce((sum, digit, position) => (
      sum + Number(digit) * (position % 2 === 0 ? 1 : 3)
    ), 0);
  const checkDigit = (10 - (weightedTotal % 10)) % 10;
  return `${firstTwelve}${checkDigit}`;
};

const buildCseBookCatalog = () => {
  let catalogIndex = 0;

  return CSE_SUBJECTS.flatMap((subject) => (
    FOCUS_AREAS.flatMap((focus, focusIndex) => (
      BOOK_FORMATS.map((format, formatIndex) => {
        catalogIndex += 1;
        const totalCopies = 3 + (catalogIndex % 8);
        const editionNumber = 1 + ((focusIndex + formatIndex) % 5);

        return {
          title: `${subject.name}: ${focus} - ${format}`,
          isbn: createIsbn13(catalogIndex),
          author: AUTHORS[(catalogIndex - 1) % AUTHORS.length],
          categoryName: subject.name,
          course: "BTech CSE",
          department: "Computer Science and Engineering",
          semester: subject.semester,
          subjectCode: subject.code,
          edition: `Edition ${editionNumber}`,
          publisher: PUBLISHERS[(catalogIndex - 1) % PUBLISHERS.length],
          publishedYear: 2012 + (catalogIndex % 15),
          language: "English",
          totalCopies,
          availableCopies: totalCopies,
          shelfLocation: `CSE-S${subject.semester}-${String(catalogIndex).padStart(4, "0")}`,
          description: `${focus} for ${subject.name}, designed for BTech CSE semester ${subject.semester} students with ${format.toLowerCase()} coverage.`,
          tags: [
            "btech cse",
            `semester ${subject.semester}`,
            subject.code.toLowerCase(),
            ...subject.keywords
          ]
        };
      })
    ))
  ));
};

module.exports = {
  CSE_SUBJECTS,
  buildCseBookCatalog,
  createIsbn13
};
