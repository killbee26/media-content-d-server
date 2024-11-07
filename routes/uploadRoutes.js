const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');

const router = express.Router();
const upload = multer(); // In-memory file upload

router.post('/upload', upload.single('video'), uploadFile);

module.exports = router;
