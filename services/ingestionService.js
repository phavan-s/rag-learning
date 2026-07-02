const client = require("./elasticsearchService");

async function storeChunk(chunk, embedding) {

  const document = {
    chunkId: chunk.chunkId,
    documentName: chunk.documentName,
    chunkText: chunk.chunkText,
    startPosition: chunk.startPosition || 0,
    endPosition: chunk.endPosition || 0,
    embedding
  };

  await client.index({
    index: "pdf_chunks",
    id: `${chunk.documentName}-${chunk.chunkId}`,
    document
  });

}

module.exports = {
  storeChunk
};