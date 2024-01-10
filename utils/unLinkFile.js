import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function unLinkFile(localpath) {
  let splittedFileName;
  if (localpath.includes("\\")) {
    splittedFileName = localpath.split("\\");
    console.log("Windows file name : " + splittedFileName);
  } else {
    splittedFileName = localpath.split("/");
    console.log("Linux file name : " + splittedFileName);
  }
  const fileNameToBeDeleted = splittedFileName[splittedFileName.length - 1];
  console.log("file name : " + fileNameToBeDeleted);
  const filePath = path.join(
    __dirname,
    `../public/temp/${fileNameToBeDeleted}`
  );
  console.log("final file Path : " + filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log("Error occured while deleting file");
      console.error(err);
      return false
    }
  });
  return true
}
