// === API Module ===
// Handles Gemini Vision API calls for photo analysis

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Bạn là một photographer chuyên nghiệp với hơn 20 năm kinh nghiệm trong nhiếp ảnh nghệ thuật, chụp chân dung, phong cảnh, đường phố, và thương mại. Bạn cũng là giám khảo các cuộc thi nhiếp ảnh quốc tế.

Hãy phân tích bức ảnh được cung cấp và trả về kết quả phân tích theo đúng JSON format bên dưới. Chấm điểm công bằng, chính xác, đưa ra nhận xét chi tiết và góp ý cụ thể, thực tế để người chụp có thể cải thiện.

BẮT BUỘC trả về JSON hợp lệ theo cấu trúc sau (không thêm markdown, không thêm text ngoài JSON):

{
  "overall_score": <số nguyên từ 0-100>,
  "verdict": "<nhận xét tổng quan ngắn gọn, 1-2 câu>",
  "criteria": {
    "composition": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về bố cục: quy tắc 1/3, leading lines, framing, balance, negative space...>"
    },
    "lighting": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về ánh sáng: hướng sáng, chất lượng ánh sáng, shadow, highlight, golden hour...>"
    },
    "color": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về màu sắc: color harmony, white balance, color grading, saturation, contrast...>"
    },
    "sharpness": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về độ nét: focus, depth of field, noise, chi tiết, texture...>"
    },
    "emotion": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về cảm xúc/câu chuyện: mood, storytelling, connection, impact, ý nghĩa...>"
    },
    "technical": {
      "score": <0-100>,
      "comment": "<nhận xét chi tiết về kỹ thuật: exposure, dynamic range, post-processing, chất lượng ảnh tổng thể...>"
    }
  },
  "analysis": "<phân tích tổng quan chi tiết về bức ảnh, phong cách, thể loại, điểm mạnh, điểm yếu - 3-5 đoạn văn>",
  "suggestions": [
    {
      "title": "<tiêu đề góp ý ngắn gọn>",
      "detail": "<mô tả chi tiết cách cải thiện>",
      "priority": "<high|medium|low>"
    }
  ]
}

Lưu ý:
- Chấm điểm thực tế, không quá dễ dãi cũng không quá khắt khe
- Góp ý phải cụ thể, có thể thực hiện được (actionable)
- Phân tích bằng tiếng Việt
- Trả về tối thiểu 3 góp ý, tối đa 6 góp ý
- overall_score nên là trung bình có trọng số của các tiêu chí`;

/**
 * Get API key from localStorage
 */
export function getApiKey() {
  return localStorage.getItem('gemini_api_key') || '';
}

/**
 * Save API key to localStorage
 */
export function setApiKey(key) {
  localStorage.setItem('gemini_api_key', key.trim());
}

/**
 * Check if API key is set
 */
export function hasApiKey() {
  return !!getApiKey();
}

/**
 * Analyze a photo using Gemini Vision API
 * @param {string} base64Image - Base64-encoded image data (without prefix)
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<object>} Parsed analysis result
 */
export async function analyzePhoto(base64Image, mimeType) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Vui lòng nhập API Key trong phần Cài đặt');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 4096,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 400) {
      throw new Error('API Key không hợp lệ hoặc request bị lỗi. Vui lòng kiểm tra lại.');
    }
    if (response.status === 429) {
      throw new Error('Đã vượt quá giới hạn request. Vui lòng thử lại sau ít phút.');
    }
    throw new Error(errorData?.error?.message || `Lỗi API: ${response.status}`);
  }

  const data = await response.json();

  // Extract text content from Gemini response
  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('Không nhận được phản hồi từ AI. Vui lòng thử lại.');
  }

  // Parse JSON from response
  try {
    // Try to extract JSON if wrapped in markdown code blocks
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : textContent.trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse AI response:', textContent);
    throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
  }
}
