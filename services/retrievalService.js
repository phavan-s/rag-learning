const client = require("./elasticsearchService");

async function retrieveChunks(queryEmbedding, topK = 5) {

  const response = await client.search({

    index: "pdf_chunks",

    knn: {
      field: "embedding",
      query_vector: queryEmbedding,
      k: topK,
      num_candidates: 100
    },

    _source: [
      "chunkId",
      "documentName",
      "chunkText"
    ]

  });

  return response.hits.hits;

}

module.exports = {
  retrieveChunks
};