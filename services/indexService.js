const client = require("./elasticsearchService");

const INDEX_NAME = "pdf_chunks";

async function createIndex() {

  const exists = await client.indices.exists({
    index: INDEX_NAME
  });

  if (exists) {
    console.log("Index already exists.");
    return;
  }

  await client.indices.create({

    index: INDEX_NAME,

    mappings: {

      properties: {

  chunkId: {
    type: "integer"
  },

  documentName: {
    type: "keyword"
  },

  chunkText: {
    type: "text"
  },

  startPosition: {
    type: "integer"
  },

  endPosition: {
    type: "integer"
  },

  embedding: {
    type: "dense_vector",
    dims: 1024,
    index: true,
    similarity: "cosine"
  }

}

    }

  });

  console.log("Index created successfully.");

}

module.exports = {
  createIndex,
  INDEX_NAME
};