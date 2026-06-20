const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const { authenticate } = require('../middleware/auth');

// Import pdf-parse (v2.4.5) — named export PDFParse class
const { PDFParse } = require('pdf-parse');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

/**
 * Extract text from PDF buffer using pdf-parse v2.4.5
 * API: new PDFParse({ data, verbosity }) → await load() → getText() → string
 */
async function extractPdfText(buffer) {
  const options = {
    data: buffer,
    verbosity: 0, // suppress warnings
  };
  const instance = new PDFParse(options);
  await instance.load();

  // getText() returns a Promise resolving to { pages: [...], text: "...", total: ... }
  const result = await instance.getText();

  // Extract the text string from { pages, text, total }
  if (result && typeof result.text === 'string') {
    return result.text;
  }
  if (result && result.pages && Array.isArray(result.pages)) {
    return result.pages.map(p => p.text || '').join('\n');
  }
  return '';
}

/**
 * POST /api/upload/resume
 * Upload resume file and extract text content
 */
router.post('/resume', authenticate, upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded.' });
    }

    const { buffer } = req.file;
    const mimetype = req.file.mimetype;
    const fileName = req.file.originalname;
    let extractedText = '';

    console.log(`[Upload] Processing file: ${fileName}, type: ${mimetype}`);

    try {
      if (mimetype === 'application/pdf') {
        try {
          extractedText = await extractPdfText(buffer);
          console.log(`[Upload] PDF extraction result: ${extractedText.length} characters`);

          if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({
              detail: 'This PDF appears to contain no extractable text. It may be a scanned image. Please upload a text-based PDF or paste your resume manually.'
            });
          }
        } catch (pdfError) {
          console.error(`[Upload] PDF parsing error for ${fileName}:`, pdfError.message);
          return res.status(400).json({
            detail: 'Unable to read this PDF. Please ensure it is a valid PDF file with selectable text, or paste your resume manually.'
          });
        }
      } else if (
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';

          console.log(`[Upload] DOCX extraction result: ${extractedText.length} characters`);

          if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({
              detail: 'Could not extract text from this document. Please ensure the file contains readable text, or paste your resume manually.'
            });
          }
        } catch (docError) {
          console.error(`[Upload] DOCX parsing error for ${fileName}:`, docError.message);
          return res.status(400).json({
            detail: 'Unable to read this document. Please upload a valid DOCX file or paste your resume manually.'
          });
        }
      } else {
        return res.status(400).json({ detail: 'Unsupported file type. Only PDF and DOCX files are allowed.' });
      }

      console.log(`[Upload] Successfully extracted ${extractedText.length} characters from ${fileName}`);
      res.json({
        success: true,
        text: extractedText.trim(),
        fileName: fileName,
      });
    } catch (error) {
      console.error(`[Upload] File extraction error for ${fileName}:`, error);
      return res.status(500).json({
        detail: 'Failed to extract text from file. Please paste your resume content manually.'
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;