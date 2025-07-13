import { exec } from 'child_process'
import { readFile, unlink } from 'fs/promises'
import { promisify } from 'util'

import type { WhisperResult, LanguageCode } from './types'

import { cleanTranscript } from './transcript-cleaner'

const execAsync = promisify(exec)

type WhisperModel = 'base' | 'large' | 'medium' | 'small' | 'turbo'

const COMPLEX_LANGUAGES: LanguageCode[] = ['zh', 'ja', 'ko', 'ar', 'hi', 'th']

const selectWhisperModel = (detectedLanguage?: string): WhisperModel =>
  (detectedLanguage && COMPLEX_LANGUAGES.includes(detectedLanguage as LanguageCode) ? 'base' : 'turbo')

const getAudioQuality = (detectedLanguage?: string): string =>
  (detectedLanguage && ['ja', 'ko', 'zh'].includes(detectedLanguage) ? '192k' : '128k')

const buildAudioCommand = (url: string, tempAudioFile: string, quality: string): string => {
  const args = [
    'yt-dlp',
    '-x',
    '--audio-format wav',
    `--audio-quality ${quality}`,
    '--no-warnings',
    '-o',
    `"${tempAudioFile}.%(ext)s"`,
    `"${url}"`,
  ]
  return args.join(' ')
}

const buildWhisperCommand = (tempAudioFile: string, model: WhisperModel, detectedLanguage?: string): string => {
  const args = [
    'whisper',
    `"${tempAudioFile}.wav"`,
    `--model ${model}`,
    '--output_format txt',
    detectedLanguage ? `--language ${detectedLanguage}` : '--language auto',
    '--fp16 True',
    '--verbose False',
    '--word_timestamps False',
    '--no_speech_threshold 0.6',
    '--logprob_threshold -1.0',
  ]
  return args.join(' ')
}

const extractLanguageFromStderr = (stderr: string): string | undefined => {
  const languageMatch = stderr.match(/Detected language: (\w+)/)
  return languageMatch ? languageMatch[1] : undefined
}

const cleanupTempFiles = async (tempAudioFile: string): Promise<void> => {
  try {
    await execAsync(`rm -f "${tempAudioFile}.wav" "${tempAudioFile}.txt"`)
  } catch {
    // Ignore cleanup errors
  }
}

export const extractWithWhisper = async (url: string, detectedLanguage?: string): Promise<WhisperResult> => {
  const model = selectWhisperModel(detectedLanguage)
  const tempAudioFile = `temp_audio_${Date.now()}`

  try {
    const audioQuality = getAudioQuality(detectedLanguage)
    const audioCommand = buildAudioCommand(url, tempAudioFile, audioQuality)

    await execAsync(audioCommand)

    const whisperCommand = buildWhisperCommand(tempAudioFile, model, detectedLanguage)

    console.log(`Using Whisper model: ${model} for language: ${detectedLanguage || 'auto'}`)
    const { stderr } = await execAsync(whisperCommand)

    const finalDetectedLanguage = detectedLanguage || extractLanguageFromStderr(stderr)

    const textFile = `${tempAudioFile}.txt`
    const rawTranscript = await readFile(textFile, 'utf-8')
    const cleanedTranscript = cleanTranscript(rawTranscript.trim())

    await unlink(`${tempAudioFile}.wav`)
    await unlink(textFile)

    console.log(`🎤 Whisper extraction successful (${model})`)
    console.log(`📊 Original length: ${rawTranscript.length} chars`)
    console.log(`📊 Cleaned length: ${cleanedTranscript.length} chars`)

    return {
      transcript: cleanedTranscript,
      source: 'whisper',
      detectedLanguage: finalDetectedLanguage,
      model,
    }
  } catch (error) {
    await cleanupTempFiles(tempAudioFile)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to extract with Whisper: ${errorMessage}`)
  }
}
