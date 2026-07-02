const express = require("express");

console.log("Search route loaded");

const { generateEmbedding } = require("../services/embeddingService");
const { retrieveChunks } = require("../services/retrievalService");
const { generateAnswer } = require("../services/llmService");

const router = express.Router();

router.post("/search", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    const queryEmbedding =
      await generateEmbedding(question);

    const chunks =
      await retrieveChunks(queryEmbedding);

    res.json({
      question,
      chunks
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.post("/ask", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required."
      });
    }

    // Step 1
    const queryEmbedding =
      await generateEmbedding(question);

    // Step 2
    const chunks =
      await retrieveChunks(queryEmbedding);

    // Step 3
    const context =
      chunks
        .map(chunk => chunk._source.chunkText)
        .join("\n\n");

    // Step 4
    const answer =
      await generateAnswer(
        context,
        question
      );

    res.json({

      question,

      answer,

      sources:
        chunks.map(chunk => ({
          chunkId:
            chunk._source.chunkId,

          document:
            chunk._source.documentName
        }))

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

module.exports = router;