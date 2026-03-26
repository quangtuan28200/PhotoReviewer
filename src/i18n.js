export const translations = {
  vi: {
    hero: {
      title: "Chuyên Gia Nhiếp Ảnh AI",
      subtitle: "Đưa bức ảnh của bạn cho \"đôi mắt\" AI chuyên nghiệp. Nhận phân tích chuyên sâu về bố cục, ánh sáng và kỹ thuật từ một nhiếp ảnh gia ảo đẳng cấp thế giới."
    },
    nav: {
      login: "Đăng nhập",
      history: "Lịch sử phân tích",
      settings: "Cài đặt API",
      logout: "Đăng xuất"
    },
    upload: {
      dragdrop: "Kéo thả ảnh vào đây",
      or: "hoặc",
      browse: "Chọn ảnh từ máy",
      hint: "Hỗ trợ JPG, PNG, WebP — Tối đa 10MB",
      selected: "Ảnh đã chọn",
      clear: "✕ Xóa",
      analyze_btn: "Phân tích ảnh"
    },
    loading: {
      title: "AI đang phân tích ảnh...",
      desc: "Photographer AI đang xem xét bố cục, ánh sáng, màu sắc và nhiều tiêu chí khác"
    },
    loading_history: {
      title: "Đang tải bản review...",
      desc: "Đang truy xuất dữ liệu từ hệ thống lưu trữ"
    },
    features: {
      comp_title: "Bố cục & Khung hình",
      comp_desc: "Phân tích các quy tắc kinh điển như 1/3, đường dẫn, sự đối xứng và cách sắp xếp chủ thể trong không gian.",
      light_title: "Ánh sáng & Màu sắc",
      light_desc: "Đánh giá độ phơi sáng, tương phản, độ bão hòa và cân bằng trắng để bức ảnh đạt được cảm xúc mong muốn.",
      tech_title: "Kỹ thuật & Hậu kỳ",
      tech_desc: "Gợi ý các thông số cài đặt camera và các bước hậu kỳ (Lightroom/Photoshop) để tối ưu chất lượng ảnh."
    },
    how_it_works: {
      title: "Quy trình Phân tích",
      step1_title: "Gửi ảnh cho Chuyên gia",
      step1_desc: "Tải lên tác phẩm của bạn để AI bắt đầu quá trình quét và nhận diện đa lớp.",
      step2_title: "Phân tích theo tiêu chuẩn Pro",
      step2_desc: "AI đối chiếu bức ảnh với hàng triệu tác phẩm nhiếp ảnh kinh điển để đưa ra đánh giá khách quan.",
      step3_title: "Nhận bảng điểm & Lời khuyên",
      step3_desc: "Xem điểm số chi tiết từng tiêu chí và áp dụng các góp ý mang tính chuyên môn cao."
    },
    results: {
      overall_score: "Điểm tổng",
      criteria_score: "Điểm theo tiêu chí",
      detailed_analysis: "Phân tích chi tiết",
      suggestions_title: "Góp ý cải thiện",
      review_another: "Review ảnh khác"
    },
    history: {
      title: "Lịch sử phân tích",
      empty: "Bạn chưa có bản phân tích nào.",
      clear_btn: "Xóa lịch sử",
      score: "Điểm"
    },
    criteria: {
      composition: "Bố cục",
      lighting: "Ánh sáng",
      color: "Màu sắc",
      sharpness: "Độ nét",
      emotion: "Cảm xúc",
      technical: "Kỹ thuật"
    },
    settings: {
      title: "Cài đặt Gemini API",
      desc: "Nhập Gemini API Key của bạn để sử dụng ứng dụng. API Key của bạn sẽ được lưu trữ an toàn trong tài khoản của bạn trên cơ sở dữ liệu cloud.",
      get_key_html: 'Bạn chưa có API Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Lấy key tại đây</a>.',
      label: "API Key Gemini:",
      placeholder: "Dán API Key của bạn vào đây...",
      save_btn: "Lưu thay đổi",
      close_btn: "Đóng"
    },
    messages: {
      login_required: "Vui lòng đăng nhập để xem trang này",
      image_process_error: "Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại.",
      unsupported_format: "Định dạng ảnh không hỗ trợ. Vui lòng chọn JPG, PNG hoặc WebP.",
      file_too_large: "Ảnh quá lớn. Vui lòng chọn ảnh dưới 20MB.",
      analysis_complete: "Phân tích ảnh hoàn tất!",
      history_not_found: "Không tìm thấy bản review này",
      settings_saved: "Đã lưu API Key thành công!",
      settings_save_error: "Lỗi lưu cài đặt",
      no_history_to_clear: "Không có lịch sử để xóa",
      history_cleared: "Đã xóa lịch sử",
      ai_return_error: "AI trả về dữ liệu không đầy đủ. Vui lòng thử lại.",
      generic_error: "Có lỗi xảy ra. Vui lòng thử lại.",
      select_photo_required: "Vui lòng chọn ảnh trước",
      no_suggestions: "Không có góp ý nào"
    }
  },
  en: {
    hero: {
      title: "AI Photography Expert",
      subtitle: "Hand your photo to the \"eyes\" of a professional AI. Get in-depth analysis of composition, lighting, and technique from a world-class virtual photographer."
    },
    nav: {
      login: "Login",
      history: "Analysis History",
      settings: "API Settings",
      logout: "Logout"
    },
    upload: {
      dragdrop: "Drag & drop image here",
      or: "or",
      browse: "Browse from device",
      hint: "Supports JPG, PNG, WebP — Max 10MB",
      selected: "Selected Image",
      clear: "✕ Clear",
      analyze_btn: "Analyze Photo"
    },
    loading: {
      title: "AI is analyzing photo...",
      desc: "Photographer AI is reviewing composition, lighting, colors, and more"
    },
    loading_history: {
      title: "Loading review...",
      desc: "Retrieving data from cloud storage"
    },
    features: {
      comp_title: "Composition & Framing",
      comp_desc: "Analysis of classic rules like rule of thirds, leading lines, symmetry, and subject placement.",
      light_title: "Lighting & Colors",
      light_desc: "Evaluation of exposure, contrast, saturation, and white balance to evoke the desired mood.",
      tech_title: "Technique & Editing",
      tech_desc: "Suggestions for camera settings and post-processing steps (Lightroom/Photoshop) to optimize quality."
    },
    how_it_works: {
      title: "How It Works",
      step1_title: "Send to the Expert",
      step1_desc: "Upload your work for the AI to begin scanning and multi-layer recognition.",
      step2_title: "Pro-Standard Analysis",
      step2_desc: "The AI cross-references your photo with millions of classic works to provide objective evaluation.",
      step3_title: "Score & Advice",
      step3_desc: "View detailed scores for each criteria and apply high-level professional advice."
    },
    results: {
      overall_score: "Overall Score",
      criteria_score: "Criteria Scores",
      detailed_analysis: "Detailed Analysis",
      suggestions_title: "Improvement Suggestions",
      review_another: "Review Another Photo"
    },
    history: {
      title: "Analysis History",
      empty: "You don't have any reviews yet.",
      clear_btn: "Clear History",
      score: "Score"
    },
    criteria: {
      composition: "Composition",
      lighting: "Lighting",
      color: "Color",
      sharpness: "Sharpness",
      emotion: "Emotion",
      technical: "Technical"
    },
    settings: {
      title: "Gemini API Settings",
      desc: "Enter your Gemini API Key to use the application. Your key will be securely stored in your account on the cloud database.",
      get_key_html: 'Don\'t have an API Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">Get it here</a>.',
      label: "Gemini API Key:",
      placeholder: "Paste your API Key here...",
      save_btn: "Save Changes",
      close_btn: "Close"
    },
    messages: {
      login_required: "Please login to view this page",
      image_process_error: "Error processing image. Please try again.",
      unsupported_format: "Unsupported image format. Please choose JPG, PNG, or WebP.",
      file_too_large: "File is too large. Please select an image under 20MB.",
      analysis_complete: "Analysis complete!",
      history_not_found: "Review not found",
      settings_saved: "API Key saved successfully!",
      settings_save_error: "Error saving settings",
      no_history_to_clear: "No history to clear",
      history_cleared: "History cleared",
      ai_return_error: "AI returned incomplete data. Please try again.",
      generic_error: "An error occurred. Please try again.",
      select_photo_required: "Please select a photo first",
      no_suggestions: "No suggestions available"
    }
  }
};

let currentLang = localStorage.getItem('appLang') || 'vi';

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    renderTranslations();
    
    // Update language toggle UI if needed
    const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
    if (activeBtn) {
      document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
      activeBtn.classList.add('active');
    }
  }
}

export function t(keyStr) {
  const keys = keyStr.split('.');
  let value = translations[currentLang];
  for (const k of keys) {
    if (value === undefined) return keyStr;
    value = value[k];
  }
  return value || keyStr;
}

export function renderTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const isHtml = el.getAttribute('data-i18n-html') === 'true';
    const translation = t(key);
    
    if (isHtml) {
      el.innerHTML = translation;
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (['button', 'submit', 'reset'].includes(el.type)) {
        el.value = translation;
      } else {
        el.placeholder = translation;
      }
    } else {
      el.textContent = translation;
    }
  });
}
