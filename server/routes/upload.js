import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';

const router = express.Router();

const baseUploads = path.resolve('uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const now = new Date();
    const dir = path.join(
      baseUploads,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    );
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.img';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const host = `${req.protocol}://${req.get('host')}`;
  const rel = path.relative(baseUploads, req.file.destination);
  const url = `/uploads/${rel}/${req.file.filename}`.replace(/\\/g, '/');
  res.json({ success: true, url });
});

export default router;
