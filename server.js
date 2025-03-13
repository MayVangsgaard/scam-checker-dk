import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" })); // Allow frontend requests
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/check-scam", async (req, res) => {
  const { text, type } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text input is required" });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Du er en AI, der vurderer svindelbeskeder på dansk." },
          { 
            role: "user", 
            content: `Analyser denne ${type === "message" ? "SMS" : "email"} for tegn på svindel. 

            **Formatkrav:**
            - Brug overskrifter uden asterisks.
            - Ingen unødvendige symboler eller dashes før sætninger.
            - Skriv klart og præcist med tydelige afsnit.
            - Hvis en virksomhed nævnes, forsøg at finde deres officielle kundeservice-kontakt (telefonnummer, email eller hjemmeside).
            - Hvis ingen officiel kontakt kan findes, skriv: "Ingen verificeret kundeservice fundet."

            **Afsluttende anbefaling:**  
            - Hvis beskeden er svindel, anbefal at modtageren blot **sletter den** og ikke svarer.  
            - Hvis der er **mulighed** for, at beskeden er legitim, tilføj denne sætning:  
              *"Hvis du vil være helt sikker på, at denne service fortsat fungerer, så kan du overveje at kontakte dem direkte på følgende måde:"*  
              (og inkluder kontaktinfo hvis tilgængelig).

            **Besked til analyse:**  
            ${text}`
          },
        ],
        temperature: 0.2,
      },
      {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      }
    );

    res.json({ result: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Fejl ved analyse af besked." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveren kører på http://localhost:${PORT}`));
