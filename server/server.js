import multer from "multer";
import {PDFParse} from "pdf-parse";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3001;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env file");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

app.use(cors());
app.use(express.json());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Please upload a PDF file."));
    }
  }
});

let uploadedDocumentText = "";
let uploadedDocumentName = "";


app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select a PDF file."
      });
    }

    parser = new PDFParse({ data: req.file.buffer });

    const result = await parser.getText();
    const extractedText = result.text?.trim();
    console.log("Uploaded PDF:", req.file.originalname);
    console.log("Extracted text length:", extractedText?.length || 0);
    console.log(
    "Extracted text preview:",
     extractedText?.slice(0, 300) || "(no text extracted)"
     );

    if (!extractedText) {
      return res.status(400).json({
        error: "No readable text found. This PDF may be scanned."
      });
    }

    uploadedDocumentText = extractedText.slice(0, 50000);
    uploadedDocumentName = req.file.originalname;

    res.json({
      message: "PDF uploaded successfully!",
      fileName: uploadedDocumentName
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    res.status(500).json({
      error: "Could not read this PDF. Please try another file."
    });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
});

app.get("/", (req, res) => {
  res.send("NEXORA AI server is running!");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are NEXORA, a helpful AI campus assistant.
Answer students clearly and politely.

If uploaded document content is provided, use it to answer
questions about that document. Do not invent facts that are
not supported by the document. If the answer is not available,
say so clearly.

Uploaded document name: ${uploadedDocumentName || "None"}
Uploaded document content:
${uploadedDocumentText || "No document has been uploaded yet."}

Student question: ${message}`
    });

    res.json({ reply: result.text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "Sorry, NEXORA could not answer right now. Please try again."
    });
  }
});

app.post("/api/summary", async (req, res) => {
  try {
    if (!uploadedDocumentText) {
      return res.status(400).json({
        error: "Please upload a PDF first."
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are NEXORA, an academic study assistant.

Create a clear, exam-friendly summary of the uploaded document.

Include:
1. A short overview
2. Important topics
3. Key definitions and facts
4. Important points for exam revision

Use simple English and bullet points.
Use only information from the document.
Do not invent facts.

Document name: ${uploadedDocumentName}

Document content:
${uploadedDocumentText}`
    });

    res.json({
      summary: result.text
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({
      error: "Could not generate the summary. Please try again."
    });
  }
});


app.post("/api/mcq", async (req, res) => {
  try {
    if (!uploadedDocumentText) {
      return res.status(400).json({
        error: "Please upload a PDF first."
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are NEXORA, an academic quiz generator.

Create 5 multiple-choice questions based ONLY on the uploaded document.

For every question:
- Give four options labelled A, B, C, and D.
- Provide exactly one correct answer.
- Give a short explanation for the correct answer.

Use this format:

Q1. Question text
A. Option
B. Option
C. Option
D. Option
Correct answer: B
Explanation: Short explanation

Repeat for all 5 questions.
Do not invent facts outside the document.

Document:
${uploadedDocumentText}`
    });

    res.json({
      mcqs: result.text
    });
  } catch (error) {
    console.error("MCQ generation error:", error);
    res.status(500).json({
      error: "Could not generate MCQs. Please try again."
    });
  }
});


app.post("/api/notice", async (req, res) => {
  try {
    if (!uploadedDocumentText) {
      return res.status(400).json({
        error: "Please upload a campus notice PDF first."
      });
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `<CodeBlock language="javascript" editable>
You are NEXORA, an AI campus notice analyzer.
Carefully inspect the entire document, especially all dates,
deadlines, and date-like text.

     Your highest priority is to extract dates accurately.

     Return these sections:
      1. NOTICE OVERVIEW
      2. ALL DATES FOUND
        - Copy every date exactly as written.
        - Include the event or task associated with each date.
        - Include dates found in headings, tables, footnotes,
          and lines near words such as exam, submission, due,
          deadline, event, from, until, and on.
      3. EXAM DATES
4. ASSIGNMENT DEADLINES
5. EVENTS AND ACTIVITIES
6. IMPORTANT INSTRUCTIONS
7. ACTION ITEMS FOR STUDENTS
Rules:
- Examine the entire extracted document text, not just its beginning.
- Preserve the original date format, including day, month, and year.
- Do not guess missing dates or years.
- If a date is ambiguous, quote it and explain the ambiguity.
- If no date is found for a category, say "No date found in the readable text."
- Use only information supported by the document.
- Use simple English and bullet points.
Document name: ${uploadedDocumentName}
Document content:
${uploadedDocumentText}
</CodeBlock>`

    });

    res.json({
      noticeAnalysis: result.text
    });
  } catch (error) {
    console.error("Notice analysis error:", error);
    res.status(500).json({
      error: "Could not analyze the notice. Please try again."
    });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXORA server running on port ${PORT}`);
});

