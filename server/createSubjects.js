const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Subject = require("./models/Subject");

dotenv.config();

const subjects = [
  {
    name: "Database Management System",
    code: "DBMS",
    semester: 4,
  },
  {
    name: "Operating Systems",
    code: "OS",
    semester: 4,
  },
  {
    name: "Computer Networks",
    code: "CN",
    semester: 5,
  },
  {
    name: "Data Structures",
    code: "DS",
    semester: 3,
  },
  {
    name: "Software Engineering",
    code: "SE",
    semester: 5,
  },
];

const createSubjects = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const subject of subjects) {
      const exists = await Subject.findOne({
        code: subject.code,
      });

      if (!exists) {
        await Subject.create(subject);
        console.log(
          `Created subject: ${subject.name}`
        );
      } else {
        console.log(
          `Already exists: ${subject.name}`
        );
      }
    }

    console.log("Subject seeding completed");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

createSubjects();