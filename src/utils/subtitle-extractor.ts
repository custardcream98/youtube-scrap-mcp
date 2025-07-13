import { exec } from 'child_process'
import { access, constants } from 'fs/promises'
import { promisify } from 'util'

import type { SubtitleResult, LanguageCode, YouTubeVideoInfo } from './types'

import { detectVideoLanguage } from './language-detector'
import { cleanTranscript } from './transcript-cleaner'
import { parseVTTFile } from './vtt-parser'

const execAsync = promisify(exec)

const expandLanguageCodes = (languages: LanguageCode[]): string[] =>
  languages.flatMap(lang => {
    const expansions: Record<LanguageCode, string[]> = {
      ko: ['ko', 'kr'],
      ja: ['ja', 'jp'],
      zh: ['zh', 'zh-CN', 'zh-TW', 'zh-Hans', 'zh-Hant'],
      en: ['en', 'en-US', 'en-GB'],
      th: ['th'],
      ar: ['ar'],
      hi: ['hi'],
      ru: ['ru'],
      el: ['el'],
    }
    return expansions[lang] || [lang]
  })

const buildSubtitleCommand = (url: string, languages: string[], tempId: string): string => {
  const args = [
    'yt-dlp',
    '--write-subs',
    '--write-auto-subs',
    '--sub-format vtt',
    '--skip-download',
    '--no-warnings',
    `--sub-langs "${languages.join(',')}"`,
    '-o',
    `"${tempId}.%(ext)s"`,
    `"${url}"`,
  ]
  return args.join(' ')
}

const generateSubtitleFilenames = (tempId: string, lang: string): string[] => [
  `${tempId}.${lang}.vtt`,
  `${tempId}.${lang}-auto.vtt`,
  `${tempId}.${lang}.auto.vtt`,
]

const findSubtitleFile = async (
  tempId: string,
  languages: string[],
): Promise<null | { file: string; language: string }> => {
  for (const lang of languages) {
    const possibleFiles = generateSubtitleFilenames(tempId, lang)

    for (const file of possibleFiles) {
      try {
        await access(file, constants.F_OK)
        console.log(`[subtitle-extractor] Found subtitle file: ${file}`)
        return { file, language: lang }
      } catch {
        // File doesn't exist, continue to next
      }
    }
  }
  return null
}

const findAnySubtitleFile = async (tempId: string): Promise<null | { file: string; language: string }> => {
  try {
    const { stdout } = await execAsync(`ls ${tempId}*.vtt 2>/dev/null || true`)
    const files = stdout
      .trim()
      .split('\n')
      .filter(file => file.length > 0)

    if (files.length > 0) {
      const [firstFile] = files
      const languageMatch = firstFile.match(/\.([a-z-]+)\.vtt$/)
      const language = languageMatch?.[1] || 'unknown'
      console.log(`[subtitle-extractor] Found any subtitle file: ${firstFile} (${language})`)
      return { file: firstFile, language }
    }
  } catch (error) {
    console.log(`[subtitle-extractor] No subtitle files found:`, error)
  }
  return null
}

const cleanupSubtitleFiles = async (tempId: string): Promise<void> => {
  try {
    await execAsync(`rm -f ${tempId}*.vtt ${tempId}*.info.json 2>/dev/null || true`)
  } catch {
    // Ignore cleanup errors
  }
}

export const extractSubtitles = async (
  url: string,
  videoMetadata?: Partial<YouTubeVideoInfo>,
): Promise<SubtitleResult> => {
  const tempId = `temp_subs_${Date.now()}`

  try {
    const languagePriority = videoMetadata
      ? detectVideoLanguage(videoMetadata)
      : (['en', 'ko', 'ja', 'zh', 'es', 'fr'] as LanguageCode[])

    console.log(`🔍 Language priority for subtitles: ${languagePriority.join(', ')}`)

    const expandedLanguages = expandLanguageCodes(languagePriority)
    const command = buildSubtitleCommand(url, expandedLanguages, tempId)

    await execAsync(command)

    const foundFile = (await findSubtitleFile(tempId, expandedLanguages)) || (await findAnySubtitleFile(tempId))

    if (!foundFile) {
      throw new Error('No subtitle files found')
    }

    console.log(`Found subtitle file: ${foundFile.file} (language: ${foundFile.language})`)

    const rawTranscript = await parseVTTFile(foundFile.file)
    const cleanedTranscript = cleanTranscript(rawTranscript)

    await cleanupSubtitleFiles(tempId)

    console.log(`📝 Subtitle extraction successful (${foundFile.language})`)
    console.log(`📊 Original length: ${rawTranscript.length} chars`)
    console.log(`📊 Cleaned length: ${cleanedTranscript.length} chars`)

    return {
      transcript: cleanedTranscript,
      source: 'subtitles',
      language: foundFile.language,
    }
  } catch (error) {
    await cleanupSubtitleFiles(tempId)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to extract subtitles: ${errorMessage}`)
  }
}
