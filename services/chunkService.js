function chunkText(
  text,
  documentName,
  chunkSize = 1000,
  overlap = 200
) {

  const chunks = [];

  let start = 0;
  let chunkId = 1;

  while (start < text.length) {

    const end = start + chunkSize;

    const chunkContent = text
      .slice(start, end)
      .trim();

    chunks.push({
      chunkId,
      documentName,
      chunkText: chunkContent,
      startPosition: start,
      endPosition: end
    });

    chunkId++;

    start += chunkSize - overlap;
  }

  return chunks;
}

module.exports = {
  chunkText
};