// === API Module ===
// Handles Gemini Vision API calls for photo analysis

import { getLanguage, t } from "./i18n.js";
import { supabase } from "./supabase.js";
import { getCurrentUser } from "./auth.js";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getSystemPrompt(metadata) {
  const lang = getLanguage();
  const langText = lang === "en" ? "English" : "Vietnamese (tiếng Việt)";

  let metadataText = "";
  if (metadata && Object.keys(metadata).length > 0) {
    metadataText = `\n\nImage Technical Data (EXIF):`;
    if (metadata.camera) metadataText += `\n- Camera: ${metadata.camera}`;
    if (metadata.lens) metadataText += `\n- Lens: ${metadata.lens}`;
    if (metadata.focalLength)
      metadataText += `\n- Focal Length: ${metadata.focalLength}`;
    if (metadata.aperture) metadataText += `\n- Aperture: ${metadata.aperture}`;
    if (metadata.shutterSpeed)
      metadataText += `\n- Shutter Speed: ${metadata.shutterSpeed}`;
    if (metadata.iso) metadataText += `\n- ISO: ${metadata.iso}`;
    if (metadata.software) metadataText += `\n- Software: ${metadata.software}`;

    metadataText += `\n\nPlease use the EXIF data above to provide a deeper technical analysis. For example: was the shutter speed fast enough to freeze motion, did the ISO introduce excessive noise, was the aperture appropriate for the desired depth of field. Integrate this into your feedback.`;
  }

  return `You are a world-class professional photographer and an international photo competition judge, with over 20 years of experience in fine-art, portrait, landscape, street, and commercial photography.

Analyze the provided photograph comprehensively. Score it fairly and accurately. Provide detailed observations and highly specific, actionable feedback to help the photographer improve.

Important Guidelines:
- Score realistically: do not be overly lenient or unnecessarily harsh.
- Feedback must be specific, constructive, and highly actionable (e.g., "crop 10% from the bottom to remove the distraction" instead of "improve composition").
- VERY IMPORTANT: Generate the actual analysis and feedback text (the values inside the JSON) in the following language: ${langText}
- Provide at least 3, and up to 6, specific improvement suggestions.
- The 'overall_score' should represent the weighted average of the individual criteria scores.${metadataText}`;
}

// JSON Schema to enforce structured output from Gemini
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    overall_score: {
      type: "INTEGER",
      description: "Overall score from 0-100",
    },
    verdict: {
      type: "STRING",
      description: "Brief overall verdict, 1-2 sentences",
    },
    criteria: {
      type: "OBJECT",
      properties: {
        composition: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER", description: "Composition score 0-100" },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on composition: rule of thirds, leading lines, framing, balance, negative space",
            },
          },
          required: ["score", "comment"],
        },
        lighting: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER", description: "Lighting score 0-100" },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on lighting: direction, quality, shadows, highlights, golden hour",
            },
          },
          required: ["score", "comment"],
        },
        color: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER", description: "Color score 0-100" },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on color: harmony, white balance, grading, saturation, contrast",
            },
          },
          required: ["score", "comment"],
        },
        sharpness: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER", description: "Sharpness score 0-100" },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on sharpness: focus, depth of field, noise, details, texture",
            },
          },
          required: ["score", "comment"],
        },
        emotion: {
          type: "OBJECT",
          properties: {
            score: {
              type: "INTEGER",
              description: "Emotion and impact score 0-100",
            },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on emotion/story: mood, storytelling, connection, visual impact, meaning",
            },
          },
          required: ["score", "comment"],
        },
        technical: {
          type: "OBJECT",
          properties: {
            score: {
              type: "INTEGER",
              description: "Technical execution score 0-100",
            },
            comment: {
              type: "STRING",
              description:
                "Detailed comment on technique: exposure, dynamic range, post-processing, overall image quality",
            },
          },
          required: ["score", "comment"],
        },
      },
      required: [
        "composition",
        "lighting",
        "color",
        "sharpness",
        "emotion",
        "technical",
      ],
    },
    analysis: {
      type: "STRING",
      description:
        "Comprehensive overall analysis of the photo, genre, strengths, weaknesses - 3 to 5 paragraphs",
    },
    exif_analysis: {
      type: "STRING",
      description:
        "Specific evaluation of the camera settings used (Aperture, Shutter Speed, ISO, Focal Length) and how they impacted the photo. If no EXIF data was provided, provide a general comment on the perceived technical quality.",
    },
    suggestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING",
            description: "Short, concise title for the suggestion",
          },
          detail: {
            type: "STRING",
            description: "Detailed, actionable description of how to improve",
          },
          priority: {
            type: "STRING",
            description: "Priority level: high, medium, or low",
          },
        },
        required: ["title", "detail", "priority"],
      },
      description: "List of 3 to 6 actionable improvement suggestions",
    },
  },
  required: [
    "overall_score",
    "verdict",
    "criteria",
    "analysis",
    "exif_analysis",
    "suggestions",
  ],
};

/**
 * Get API key from localStorage or Supabase
 */
export async function getApiKey() {
  const localKey = localStorage.getItem("gemini_api_key") || "";
  const user = getCurrentUser();

  // If no local key but user is logged in, try to fetch from DB
  if (user && !localKey) {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("api_key")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.api_key) {
        localStorage.setItem("gemini_api_key", data.api_key);
        return data.api_key;
      }
    } catch (e) {
      console.warn("Failed to fetch API key from Supabase:", e);
    }
  }

  return localKey;
}

/**
 * Save API key to localStorage and Supabase
 */
export async function setApiKey(key) {
  const trimmedKey = key.trim();
  localStorage.setItem("gemini_api_key", trimmedKey);

  const user = getCurrentUser();
  if (user) {
    try {
      await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          api_key: trimmedKey,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("Failed to save API key to Supabase:", e);
    }
  }
}

/**
 * Check if API key is set
 */
export async function hasApiKey() {
  const key = await getApiKey();
  return !!key;
}

/**
 * Analyze a photo using Gemini Vision API
 * @param {string} base64Image - Base64-encoded image data (without prefix)
 * @param {string} mimeType - Image MIME type
 * @param {object} metadata - Optional EXIF metadata
 * @returns {Promise<object>} Parsed analysis result
 */
export async function analyzePhoto(base64Image, mimeType, metadata) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error(t("messages.key_required"));
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: getSystemPrompt(metadata) },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400) {
      throw new Error(t("messages.generic_error"));
    }
    if (response.status === 429) {
      throw new Error(t("messages.generic_error"));
    }
    throw new Error(errorData?.error?.message || t("messages.generic_error"));
  }

  const data = await response.json();

  // Extract text content from Gemini response
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error(t("messages.ai_return_error"));
  }

  // Parse JSON — with responseSchema, Gemini guarantees valid JSON
  try {
    return JSON.parse(textContent);
  } catch (e) {
    console.error("Failed to parse AI response:", textContent);
    throw new Error(t("messages.ai_return_error"));
  }
}
