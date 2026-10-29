import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Server par Groq API Key set nahi hai."
      });
    }

    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (messages.length > 20) {
      return res.status(400).json({
        error: "Chat bahut lambi hai. New Chat shuru karein."
      });
    }

    const validMessages = messages.every(
      message =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.length <= 5000
    );

    if (!validMessages) {
      return res.status(400).json({
        error: "Invalid message format."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant. Reply clearly and politely. Respond in the language the user prefers."
            },
            ...messages
          ],
          temperature: 0.7,
          max_completion_tokens: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", response.status);

      return res.status(502).json({
        error: "AI service se response nahi mila. Baad mein try karein."
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "AI ka response empty hai."
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error.message);

    res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Chatbot running on port ${PORT}`);
});
