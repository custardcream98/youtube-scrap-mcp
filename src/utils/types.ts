export type YouTubeVideoInfo = {
  title?: string
  description?: string
  transcript?: string
  transcriptSource: 'subtitles' | 'whisper'
  duration?: number
  uploadDate?: string
  uploader?: string
  detectedLanguage?: string
  whisperModel?: string
  viewCount?: number
  likeCount?: number
  channelId?: string
  tags?: string[]
  categories?: string[]
}

export type ExtractionOptions = {
  includeTitle: boolean
  includeDescription: boolean
  includeTranscript: boolean
}

export type SubtitleResult = {
  transcript: string
  source: 'subtitles'
  language?: string
}

export type WhisperResult = {
  transcript: string
  source: 'whisper'
  detectedLanguage?: string
  model: string
}

export type LanguageCode = 'ar' | 'el' | 'en' | 'hi' | 'ja' | 'ko' | 'ru' | 'th' | 'zh'

export type Dependencies = {
  ytdlp: boolean
  whisper: boolean
  ffmpeg: boolean
}
