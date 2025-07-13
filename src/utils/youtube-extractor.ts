import { exec } from 'child_process'
import { promisify } from 'util'

import type { YouTubeVideoInfo, ExtractionOptions, Dependencies } from './types'

import { extractSubtitles } from './subtitle-extractor'
import { extractWithWhisper } from './whisper-extractor'

const execAsync = promisify(exec)

const extractVideoMetadata = async (url: string): Promise<Partial<YouTubeVideoInfo>> => {
  try {
    const command = ['yt-dlp', '--dump-json', '--no-download', '--no-warnings', `"${url}"`].join(' ')
    const { stdout } = await execAsync(command)
    const metadata = JSON.parse(stdout)

    return {
      title: metadata.title,
      description: metadata.description,
      duration: metadata.duration,
      uploadDate: metadata.upload_date,
      uploader: metadata.uploader || metadata.channel,
      viewCount: metadata.view_count,
      likeCount: metadata.like_count,
      channelId: metadata.channel_id,
      tags: metadata.tags || [],
      categories: metadata.categories || [],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to extract video metadata: ${errorMessage}`)
  }
}

const extractTranscript = async (
  url: string,
  metadata: Partial<YouTubeVideoInfo>,
): Promise<{
  transcript: string
  transcriptSource: 'subtitles' | 'whisper'
  detectedLanguage?: string
  whisperModel?: string
}> => {
  try {
    console.log(`[youtube-extractor] Trying subtitles first...`)
    const subtitleResult = await extractSubtitles(url, metadata)
    console.log(`[youtube-extractor] Subtitles extraction successful`)

    return {
      transcript: subtitleResult.transcript,
      transcriptSource: subtitleResult.source,
      detectedLanguage: subtitleResult.language,
    }
  } catch (subtitleError) {
    console.log(`[youtube-extractor] Subtitles not available, falling back to Whisper...`)
    console.log(`[youtube-extractor] Subtitle error:`, subtitleError)

    try {
      const whisperResult = await extractWithWhisper(url)
      console.log(`[youtube-extractor] Whisper extraction successful`)

      return {
        transcript: whisperResult.transcript,
        transcriptSource: whisperResult.source,
        detectedLanguage: whisperResult.detectedLanguage,
        whisperModel: whisperResult.model,
      }
    } catch (whisperError) {
      console.error(`[youtube-extractor] Whisper extraction failed:`, whisperError)
      const errorMessage = whisperError instanceof Error ? whisperError.message : 'Unknown error'
      throw new Error(`Both subtitle and Whisper extraction failed: ${errorMessage}`)
    }
  }
}

export const extractYouTubeContent = async (url: string, options: ExtractionOptions): Promise<YouTubeVideoInfo> => {
  console.log(`[youtube-extractor] Starting extraction for: ${url}`)
  console.log(`[youtube-extractor] Options:`, options)

  const result: YouTubeVideoInfo = {
    transcriptSource: 'subtitles',
  }

  try {
    console.log(`[youtube-extractor] Extracting metadata...`)
    const metadata = await extractVideoMetadata(url)
    console.log(`[youtube-extractor] Metadata extraction completed`)

    // Add metadata to result
    if (options.includeTitle) result.title = metadata.title
    if (options.includeDescription) result.description = metadata.description

    Object.assign(result, {
      duration: metadata.duration,
      uploadDate: metadata.uploadDate,
      uploader: metadata.uploader,
      viewCount: metadata.viewCount,
      likeCount: metadata.likeCount,
      channelId: metadata.channelId,
      tags: metadata.tags,
      categories: metadata.categories,
    })

    // Extract transcript if needed
    if (options.includeTranscript) {
      console.log(`[youtube-extractor] Extracting transcript...`)
      const transcriptResult = await extractTranscript(url, metadata)
      Object.assign(result, transcriptResult)
    }

    console.log(`[youtube-extractor] Extraction completed successfully`)
    return result
  } catch (error) {
    console.error(`[youtube-extractor] Extraction failed:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`YouTube content extraction failed: ${errorMessage}`)
  }
}

export const checkDependencies = async (): Promise<Dependencies> => {
  const checkCommand = async (command: string): Promise<boolean> => {
    try {
      await execAsync(`which ${command}`)
      return true
    } catch {
      return false
    }
  }

  const [ytdlp, whisper, ffmpeg] = await Promise.all([
    checkCommand('yt-dlp'),
    checkCommand('whisper'),
    checkCommand('ffmpeg'),
  ])

  return { ytdlp, whisper, ffmpeg }
}
