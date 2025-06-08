const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// POST /getanswer
app.post('/getanswer', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    // Improve the initial instruction
    const myPrompt = `
You are a helpful assistant that only answers questions strictly related to Dysarthria (a motor speech disorder).
If the question is outside this domain, respond with: "Sorry, this is beyond my power."
Answer clearly, concisely, and avoid unnecessary commentary.
Question:
`;

    // Use Gemini chat mode for memory
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 1024,
      },
    });

    const finalPrompt = `${myPrompt}${prompt}`;
    const result = await chat.sendMessage(finalPrompt);
    const response = result.response;
    const text1 = response.text();

    // Return both answer and updated history to maintain memory
    const cleanText = text1
  .replace(/\*\*/g, '')  // remove bold
  .replace(/\*/g, '')    // remove bullets or italics
  .replace(/_/g, '')     // remove underscores
  .trim();

res.json({
  answer: cleanText,
  history: [
    ...(history || []),
    { role: "user", parts: [{ text: finalPrompt }] },
    { role: "model", parts: [{ text: cleanText }] },
  ],
});

  } catch (error) {
    console.error("Error generating content:", error.message);
    res.status(500).json({ error: "Error generating content: " + error.message });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
