import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ Allow CORS for both local and deployed frontend
const allowedOrigins = [
  "http://localhost:3000", // Local frontend
  "https://your-frontend.vercel.app", // Replace with actual deployed frontend URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ Health check route for testing backend deployment
app.get("/api/status", (req, res) => {
  res.json({ status: "ok", message: "Serveren kører fint på Render." });
});

// ✅ Scam detection endpoint
app.post("/api/check-scam", async (req, res) => {
  const { text, type } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Indsæt venligst en besked eller e-mail." });
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Du er en høflig og professionel AI, der vurderer svindelbeskeder på dansk.",
          },
          {
            role: "user",
            content: `Analyser denne ${type === "message" ? "SMS" : "e-mail"} for tegn på svindel. 

            **Formatkrav:**
            - Brug overskrifter uden asterisks.
            - Ingen unødvendige symboler eller streger før sætninger.
            - Skriv klart og præcist med tydelige afsnit.
            - Hvis en virksomhed nævnes, forsøg at finde deres officielle kundeservice-kontakt (telefonnummer, e-mail eller hjemmeside).
            - Hvis ingen officiel kontakt kan findes, skriv: "Ingen verificeret kundeservice fundet."

            **Afsluttende anbefaling:**  
            - Hvis beskeden er svindel, anbefal venligst modtageren at **slette den** og ikke svare.  
            - Hvis der er **mulighed** for, at beskeden er legitim, tilføj denne høflige sætning:  
              *"Hvis du vil være helt sikker på, at servicen der er omtalt fortsat fungerer, kan du overveje at kontakte organisationen direkte på følgende måde:"*  
              (og inkluder kontaktinfo hvis tilgængelig).

            **Besked til analyse:**  
            ${text}`,
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
    console.error("❌ Error calling OpenAI API:", error.response?.data || error.message);
    res.status(500).json({ error: "Der opstod en fejl ved analysen. Prøv venligst igen senere." });
  }
});

// ✅ Ensure Render-compatible PORT handling
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveren kører på port ${PORT}`));
