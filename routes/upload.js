const express = require("express");
const multer = require("multer");
const pdf = require("pdf-parse");

const { chunkText } = require("../services/chunkService");
const { generateEmbedding } = require("../services/embeddingService");
const { createIndex } = require("../services/indexService");
const { storeChunk } = require("../services/ingestionService");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

router.post(
  "/upload",
  upload.single("pdf"),
  async (req, res) => {

    try {

      const data = await pdf(req.file.buffer);

      const cleanedText = data.text
        .replace(/\s+/g, " ")
        .trim();

      const chunks = chunkText(
        cleanedText,
        req.file.originalname,
        1000,
        200
      );
      await createIndex();

      // Generate one embedding for verification
      for (const chunk of chunks) {

  const embedding = await generateEmbedding(
    chunk.chunkText
  );

  await storeChunk(
    chunk,
    embedding
  );

}

      console.log(
        `${req.file.originalname} → ${chunks.length} chunks created`
      );

      res.json({
  success: true,
  document: req.file.originalname,
  pages: data.numpages,
  totalChunks: chunks.length,
  message: "Document successfully ingested into Elasticsearch."
});

    } catch (err) {

      console.error("Upload Error:", err);

      res.status(500).json({
        error: err.message
      });

    }

  }
);

module.exports = router;