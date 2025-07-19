import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: Set your Gemini API key in GEMINI_API_KEY env var
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
  }
  try {
    const { prompt } = await req.json();
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    // Generate an image using Gemini with text prompt only
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        { text: prompt }
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });
    // Find the image in the response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData && part.inlineData.data);
    if (!imagePart) {
      return NextResponse.json({ error: "No image returned from Gemini." }, { status: 500 });
    }
    const imgBytes = imagePart.inlineData.data;
    const imageUrl = `data:image/png;base64,${imgBytes}`;
    return NextResponse.json({ imageUrl });
  } catch (e: any) {
    console.error("Gemini SDK error:", e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
