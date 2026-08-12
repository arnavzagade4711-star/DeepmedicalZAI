export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { topic, prompt } = req.body || {};

    if (!topic || !prompt) {
      return res.status(400).json({
        error: "Missing topic or prompt"
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "ANTHROPIC_API_KEY is not configured on the server"
      });
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 5000,
          temperature: 0.3,
          system: `
You are DeepLearn, an evidence-based AI learning engine.

Your job is to ACTUALLY TEACH the user's requested topic.

The user may enter a medical, scientific, academic, technical,
or other educational topic.

Always make the response specifically about the requested topic.
Never give generic instructions when actual topic information
is requested.

For medical topics:
- Explain concepts accurately and clearly.
- Cover important definitions, mechanisms, classifications,
  causes, manifestations, diagnosis, management and complications
  when relevant.
- Distinguish closely related concepts.
- Include clinically useful examples when appropriate.
- Do not invent citations.
- Clearly distinguish educational information from medical advice.

For every topic:
- Use concrete examples.
- Give actual questions when requested.
- Give answers and explanations where appropriate.
- Avoid placeholders such as [topic], [condition], [example],
  [cause], etc.
- Adapt the depth to the requested learning step.
`,
          messages: [
            {
              role: "user",
              content:
                `Topic: ${topic}\n\nLearning task:\n${prompt}`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "The AI service returned an error"
      });
    }

    const content =
      data?.content
        ?.filter(item => item.type === "text")
        ?.map(item => item.text)
        ?.join("\n")
        ?.trim();

    if (!content) {
      return res.status(500).json({
        error: "The AI returned empty content"
      });
    }

    return res.status(200).json({
      content
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Unable to generate AI content"
    });
  }
}
