const { GoogleGenerativeAI } = require('@google/generative-ai');

class TranslationService {
  constructor() {
    this.isAvailable = !!process.env.GEMINI_API_KEY;
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.maxRequestsPerMinute = 50; // Increased limit for better user experience
    
    // Language code mappings
    this.languageNames = {
      'en': 'English',
      'hi': 'Hindi',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'bn': 'Bengali',
      'ur': 'Urdu',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'mr': 'Marathi',
      'or': 'Odia'
    };
    
    if (this.isAvailable) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('✅ Gemini AI translation service initialized');
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        this.isAvailable = false;
      }
    } else {
      console.warn('⚠️ Gemini API key not found. Translation service will be disabled.');
    }
  }

  // Check if we can make a request without hitting rate limits
  canMakeRequest() {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;
    
    // Reset counter every minute
    if (timeSinceReset >= 60000) {
      if (this.requestCount > 0) {
        console.log(`🔄 Rate limit reset. Previous minute: ${this.requestCount} requests`);
      }
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    const canMake = this.requestCount < this.maxRequestsPerMinute;
    if (!canMake) {
      const timeUntilReset = Math.ceil((60000 - timeSinceReset) / 1000);
      console.log(`⏱️ Rate limit reached (${this.requestCount}/${this.maxRequestsPerMinute}). Reset in ${timeUntilReset}s`);
    }
    
    return canMake;
  }

  // Manual reset for debugging
  resetRateLimit() {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    console.log('🔄 Rate limit manually reset');
  }

  async translateText(text, fromLanguage, toLanguage) {
    try {
      // If languages are the same, return original text
      if (fromLanguage === toLanguage) {
        return text;
      }

      // If translation service is not available, return original text
      if (!this.isAvailable) {
        console.log('Translation service not available, returning original text');
        return text;
      }

      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.log('⚠️ Rate limit reached, returning original text');
        return text; // Return original text instead of fallback
      }

      const fromLangName = this.languageNames[fromLanguage] || fromLanguage;
      const toLangName = this.languageNames[toLanguage] || toLanguage;

      const prompt = `Translate the following text from ${fromLangName} to ${toLangName}. 
      Only return the translated text, nothing else. If the text is already in ${toLangName}, return it as is.
      
      Text to translate: "${text}"`;

      // Increment request counter
      this.requestCount++;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      console.log(`✅ Translation successful (${this.requestCount}/${this.maxRequestsPerMinute}): "${text}" → "${translatedText}"`);

      // Remove quotes if they were added
      return translatedText.replace(/^["']|["']$/g, '');
      
    } catch (error) {
      console.error('Translation error:', error);
      
      // Check if it's a quota error
      if (error.message && error.message.includes('Quota exceeded')) {
        console.log('⚠️ Translation quota exceeded, returning original text');
        return text; // Return original text instead of fallback
      }
      
      // Fallback: return original text if translation fails
      return text;
    }
  }

  // Simple fallback translation for common phrases
  getSimpleFallbackTranslation(text, fromLanguage, toLanguage) {
    const translations = {
      'en_to_hi': {
        'hello': 'नमस्ते',
        'hi': 'नमस्ते', 
        'how are you': 'आप कैसे हैं',
        'good morning': 'सुप्रभात',
        'good night': 'शुभ रात्रि',
        'thank you': 'धन्यवाद',
        'yes': 'हाँ',
        'no': 'नहीं'
      },
      'hi_to_en': {
        'नमस्ते': 'hello',
        'आप कैसे हैं': 'how are you',
        'सुप्रभात': 'good morning',
        'शुभ रात्रि': 'good night',
        'धन्यवाद': 'thank you',
        'हाँ': 'yes',
        'नहीं': 'no'
      }
    };

    const translationKey = `${fromLanguage}_to_${toLanguage}`;
    const translationMap = translations[translationKey];
    
    if (translationMap) {
      const lowerText = text.toLowerCase();
      for (const [original, translated] of Object.entries(translationMap)) {
        if (lowerText.includes(original.toLowerCase())) {
          return text.replace(new RegExp(original, 'gi'), translated);
        }
      }
    }

    // If no simple translation found, return original text silently
    return text;
  }

  async detectLanguage(text) {
    try {
      const prompt = `Detect the language of the following text and return only the ISO 639-1 language code (like 'en', 'hi', 'es', etc.). 
      If you're not sure, return 'en'.
      
      Text: "${text}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const detectedLang = response.text().trim().toLowerCase();

      // Validate the detected language code
      if (this.languageNames[detectedLang]) {
        return detectedLang;
      }

      // Default to English if detection fails
      return 'en';
      
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  getSupportedLanguages() {
    return Object.keys(this.languageNames).map(code => ({
      code,
      name: this.languageNames[code]
    }));
  }

  isLanguageSupported(languageCode) {
    return this.languageNames.hasOwnProperty(languageCode);
  }
}

module.exports = new TranslationService();
