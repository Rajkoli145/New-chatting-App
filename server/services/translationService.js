const { GoogleGenerativeAI } = require('@google/generative-ai');

class TranslationService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
  }

  async translateText(text, fromLanguage, toLanguage) {
    try {
      // If languages are the same, return original text
      if (fromLanguage === toLanguage) {
        return text;
      }

      const fromLangName = this.languageNames[fromLanguage] || fromLanguage;
      const toLangName = this.languageNames[toLanguage] || toLanguage;

      const prompt = `Translate the following text from ${fromLangName} to ${toLangName}. 
      Only return the translated text, nothing else. If the text is already in ${toLangName}, return it as is.
      
      Text to translate: "${text}"`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();

      // Remove quotes if they were added
      return translatedText.replace(/^["']|["']$/g, '');
      
    } catch (error) {
      console.error('Translation error:', error);
      
      // Fallback: return original text if translation fails
      return text;
    }
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
