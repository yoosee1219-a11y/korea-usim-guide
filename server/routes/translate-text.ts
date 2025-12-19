import { Router } from 'express';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';

const router = Router();

// Initialize Google Translate client
const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY || '',
});

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'vi', 'th', 'tl', 'uz', 'ne', 'mn', 'id', 'my', 'zh-CN', 'ru'];

/**
 * POST /api/translate-text
 *
 * Request body:
 * {
 *   "text": "번역할 텍스트",
 *   "sourceLanguage": "ko" (optional, defaults to "ko")
 * }
 *
 * Response:
 * {
 *   "translations": {
 *     "en": "translated text",
 *     "vi": "translated text",
 *     ...
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { text, sourceLanguage = 'ko' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Text is required and must be a string'
      });
    }

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Translate API key is not configured'
      });
    }

    // Translate to all supported languages
    const translations: Record<string, string> = {};

    for (const targetLang of SUPPORTED_LANGUAGES) {
      try {
        const [translation] = await translate.translate(text, {
          from: sourceLanguage,
          to: targetLang,
        });

        translations[targetLang] = translation;
      } catch (error) {
        console.error(`Translation error for ${targetLang}:`, error);
        translations[targetLang] = text; // Fallback to original text
      }
    }

    res.json({
      success: true,
      translations
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to translate text'
    });
  }
});

export default router;
