const {
  BedrockRuntimeClient,
  InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

async function generateEmbedding(text) {

  try {

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-embed-text-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inputText: text
      })
    });

    const response =
      await client.send(command);

    const responseBody =
      JSON.parse(
        new TextDecoder()
          .decode(response.body)
      );

    return responseBody.embedding;

  } catch (error) {

    console.error(
      "Embedding Error:",
      error.message
    );

    throw error;

  }
}

async function generateEmbeddings(chunks) {

  const embeddings = [];

  for (const chunk of chunks) {

    const embedding =
      await generateEmbedding(
        chunk.chunkText
      );

    embeddings.push({
      ...chunk,
      embedding
    });

  }

  return embeddings;
}

module.exports = {
  generateEmbedding,
  generateEmbeddings
};

