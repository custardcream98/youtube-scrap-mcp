import type { LanguageCode } from './types'

type VideoMetadata = {
  title?: string
  description?: string
  uploader?: string
  tags?: string[]
}

const UNICODE_PATTERNS: Record<LanguageCode, RegExp> = {
  ko: /[\u3131-\u3163\uac00-\ud7a3]/, // Korean: Hangul Jamo + Syllables
  ja: /[\u3040-\u309f\u30a0-\u30ff]/, // Japanese: Hiragana + Katakana
  zh: /[\u4e00-\u9fff]/, // Chinese: CJK Unified Ideographs
  th: /[\u0e00-\u0e7f]/, // Thai
  ar: /[\u0600-\u06ff]/, // Arabic
  hi: /[\u0900-\u097f]/, // Hindi (Devanagari)
  ru: /[\u0400-\u04ff]/, // Russian (Cyrillic)
  el: /[\u0370-\u03ff]/, // Greek
  en: /^$/, // English (fallback, no specific pattern)
} as const

const DEFAULT_PRIORITY: LanguageCode[] = ['en', 'ko', 'ja', 'zh']

const extractTextContent = (metadata: VideoMetadata): string => {
  const { title = '', description = '', uploader = '', tags = [] } = metadata
  return `${title} ${description} ${uploader} ${tags.join(' ')}`
}

const detectLanguagesFromText = (text: string): LanguageCode[] => {
  const detectedLanguages: LanguageCode[] = []

  for (const [lang, pattern] of Object.entries(UNICODE_PATTERNS)) {
    if (pattern.test(text)) {
      detectedLanguages.push(lang as LanguageCode)
    }
  }

  return detectedLanguages
}

export const detectVideoLanguage = (metadata: VideoMetadata): LanguageCode[] => {
  const content = extractTextContent(metadata)
  const detectedLanguages = detectLanguagesFromText(content)

  if (detectedLanguages.length > 0) {
    const remainingLanguages = DEFAULT_PRIORITY.filter(lang => !detectedLanguages.includes(lang))
    return [...detectedLanguages, ...remainingLanguages]
  }

  return DEFAULT_PRIORITY
}
