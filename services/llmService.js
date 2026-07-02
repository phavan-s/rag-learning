const {
  BedrockRuntimeClient,
  InvokeModelCommand
} = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION
});

async function generateAnswer(context, question) {

  const prompt = `
You are a helpful AI assistant.

Answer ONLY using the information provided in the context.

If the answer is not present in the context, say:
"I couldn't find the answer in the provided documents."

Context:
${context}

Question:
${question}

Answer:
`;

  const command = new InvokeModelCommand({

    modelId: "amazon.nova-lite-v1:0",

    contentType: "application/json",

    accept: "application/json",

    body: JSON.stringify({

      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt
            }
          ]
        }
      ]

    })

  });

  const response =
    await client.send(command);

  const body =
    JSON.parse(
      new TextDecoder().decode(response.body)
    );

  return body.output.message.content[0].text;

}

module.exports = {
  generateAnswer
};