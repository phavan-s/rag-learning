const client = require("./elasticsearchService");

// RRF constant — higher value reduces the impact of rank differences
const RRF_K = 60;

async function vectorSearch(queryEmbedding, topK = 20) {
  const response = await client.search({
    index: "pdf_chunks",
    knn: {
      field: "embedding",
      query_vector: queryEmbedding,
      k: topK,
      num_candidates: 150
    },
    _source: ["chunkId", "documentName", "chunkText"]
  });

  return response.hits.hits;
}

async function bm25Search(question, topK = 20) {
  const response = await client.search({
    index: "pdf_chunks",
    query: {
      bool: {
        should: [
          {
            match: {
              chunkText: {
                query: question,
                boost: 1
              }
            }
          },
          {
            match_phrase: {
              chunkText: {
                query: question,
                boost: 2         // phrase matches rank higher
              }
            }
          }
        ]
      }
    },
    size: topK,
    _source: ["chunkId", "documentName", "chunkText"]
  });

  return response.hits.hits;
}

/**
 * Reciprocal Rank Fusion — normalises and merges scores from
 * both vector and BM25 lists regardless of their individual scales.
 *
 *   RRF score = Σ  1 / (k + rank)   across all result lists
 *
 * A chunk appearing at rank 1 in both lists scores ~2×(1/61) ≈ 0.033
 * A chunk appearing only in one list at rank 1 scores 1/61 ≈ 0.016
 * This naturally promotes chunks that are relevant to both semantics AND keywords.
 */
function reciprocalRankFusion(vectorResults, bm25Results, topK = 10) {
  const scores = new Map();
  const docs   = new Map();

  function accumulate(results, listName) {
    results.forEach((hit, index) => {
      const id       = hit._id;
      const rrfScore = 1 / (RRF_K + index + 1);
      scores.set(id, (scores.get(id) ?? 0) + rrfScore);
      if (!docs.has(id)) {
        docs.set(id, { ...hit, _rrfSources: [] });
      }
      docs.get(id)._rrfSources.push({ list: listName, rank: index + 1, rrfScore });
    });
  }

  accumulate(vectorResults, "vector");
  accumulate(bm25Results,   "bm25");

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, totalScore]) => {
      const doc = docs.get(id);
      doc._rrfScore = totalScore;
      return doc;
    });
}

async function retrieveChunks(question, queryEmbedding, topK = 10) {
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(queryEmbedding),
    bm25Search(question)
  ]);

  return reciprocalRankFusion(vectorResults, bm25Results, topK);
}

module.exports = {
  retrieveChunks,
  vectorSearch,
  bm25Search
};