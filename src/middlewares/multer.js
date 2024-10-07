import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to ensure directory exists
const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

let storage;
if (process.env.NODE_ENV === "development") {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, "../public/temp");
      ensureDirectoryExistence(dir);
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
} else {
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join("/tmp/");
      ensureDirectoryExistence(dir);
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });
}

const upload = multer({
  storage: storage,
  // fileFilter: fileFilter
});

export { upload };
