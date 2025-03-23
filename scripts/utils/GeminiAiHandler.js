import dotenv from "dotenv";

dotenv.config();

class GeminiAiHandler {
  constructor(apiKey = process.env.GEMINIAI_API_KEY) {
    if (!apiKey) {
      throw new Error("GEMINIAI_API_KEY is not defined in .env file");
    }
    this.apiKey = apiKey;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  }

  async generateContent(prompt, model = "gemini-2.0-flash") {
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling Gemini AI:", error);
      throw error;
    }
  }

  // Helper method to extract just the text from the response
  extractTextFromResponse(response) {
    try {
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (error) {
      console.error("Error extracting text from response:", error);
      return null;
    }
  }
}

export default GeminiAiHandler;
