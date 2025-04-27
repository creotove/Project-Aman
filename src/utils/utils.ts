import fs from 'fs';
import multer from 'multer';
import { Request } from 'express';
import { BadRequestError } from '@/utils/ApiError';
import path from 'path';

export const filterEnumValues = <T>(queryParam: string | undefined, enumObj: Record<string, T>): T[] => {
  return (queryParam?.split(',') || []).filter(value => Object.values(enumObj).includes(value as T)) as T[];
};

export const parseBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  return value === 'true';
};

const ensureDirectoryExistence = (dir: fs.PathLike) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(__dirname, '../uploads/');
    ensureDirectoryExistence(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

export const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only CSV and Excel files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
});

// get the header row from the parsed file(csv/excel) for comparision with the required fields
export const getHeaders = (data: any) => {
  const headers = Object.keys(data[0]);
  return headers;
};

export const findFileByPrefix = async (filePrefix: string): Promise<string | null> => {
  const dir = path.join(__dirname, '../uploads/');

  const uploadsDir = path.resolve(dir);

  try {
    const files = await fs.promises.readdir(uploadsDir);
    const matchingFile = files.find(file => file.startsWith(filePrefix));

    if (matchingFile) {
      return path.join(uploadsDir, matchingFile);
    }

    return null;
  } catch (error) {
    console.error('Error finding file:', error);
    return null;
  }
};

export const cleanupFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
