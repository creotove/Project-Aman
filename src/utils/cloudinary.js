import { v2 } from "cloudinary";
import dotenv from "dotenv";
import { unLinkFile } from "./unLinkFile.js";
import crypto from "crypto";
import fs from "fs";

dotenv.config();
const cloudinary = v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageCache = new Map();

const generateHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //uplod file on cloudinary
    const fileHash = await generateHash(localFilePath);
    if (imageCache.has(fileHash)) {
      console.log("Image found in cache");
      return imageCache.get(fileHash);
    }

    const existingAsset = await cloudinary.search.expression(`folder:${process.env.CLOUDINARY_FOLDER} AND tags=${fileHash}`).execute();

    if (existingAsset.total_count > 0) {
      console.log("Image found on Cloudinary");
      const result = {
        public_id: existingAsset.resources[0].public_id,
        secure_url: existingAsset.resources[0].secure_url,
      };
      imageCache.set(fileHash, result);
      return result;
    }

    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: process.env.CLOUDINARY_FOLDER,
      tags: [fileHash],
    });

    const result = {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
    };

    imageCache.set(fileHash, result);

    return result;

    // Respond with the Cloudinary URL or any other desired information
  } catch (error) {
    return null;
  } finally {
    unLinkFile(localFilePath)
      .then((result) => {
        console.log("Deletion result:", result);
      })
      .catch((error) => {
        console.error("Deletion error:", error);
      });
  }
};

export default uploadOnCloudinary;
