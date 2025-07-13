import { type InferSchema } from 'xmcp'
import { z } from 'zod'

import { extractYouTubeContent, checkDependencies } from '@/utils/youtube-extractor'

// Define the schema for tool parameters
export const schema = {
  url: z.string().url().describe('YouTube video URL to extract content from'),
  includeTitle: z.boolean().optional().default(true).describe('Include video title in the output'),
  includeDescription: z.boolean().optional().default(true).describe('Include video description in the output'),
  includeTranscript: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include video transcript/audio content in the output'),
}

// Define tool metadata
export const metadata = {
  name: 'extract-youtube',
  description:
    'Extract comprehensive content from YouTube videos including title, description, and transcript. Automatically uses available subtitles with language priority or falls back to optimized Whisper speech-to-text conversion with language detection.',
  annotations: {
    title: 'Extract YouTube Video Content',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
}

/**
 * Format duration from seconds to readable format
 */
const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'Unknown'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * Format number with commas
 */
const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) return 'Unknown'
  return num.toLocaleString()
}

/**
 * Format upload date
 */
const formatUploadDate = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown'

  // yt-dlp returns date in YYYYMMDD format
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)

  return `${year}-${month}-${day}`
}

// Tool implementation
export default async function extractYoutube({
  url,
  includeTitle,
  includeDescription,
  includeTranscript,
}: InferSchema<typeof schema>) {
  try {
    console.log(`[extract-youtube] Starting extraction for URL: ${url}`)
    console.log(
      `[extract-youtube] Options: title=${includeTitle}, description=${includeDescription}, transcript=${includeTranscript}`,
    )

    // Check dependencies first
    console.log(`[extract-youtube] Checking dependencies...`)
    const deps = await checkDependencies()
    console.log(`[extract-youtube] Dependencies check result:`, deps)

    if (!deps.ytdlp) {
      return {
        content: [
          {
            type: 'text',
            text:
              '❌ Error: yt-dlp is not installed. Please install it first:\n\n' +
              'pip install yt-dlp\n' +
              '# or\n' +
              'brew install yt-dlp',
          },
        ],
      }
    }

    if (!deps.ffmpeg) {
      return {
        content: [
          {
            type: 'text',
            text:
              '❌ Error: ffmpeg is not installed. Please install it first:\n\n' +
              'brew install ffmpeg\n' +
              '# or\n' +
              'sudo apt install ffmpeg',
          },
        ],
      }
    }

    if (includeTranscript && !deps.whisper) {
      return {
        content: [
          {
            type: 'text',
            text:
              '⚠️ Warning: Whisper is not installed. Transcript extraction will only work if subtitles are available.\n\n' +
              'To install Whisper:\n' +
              'pip install openai-whisper\n' +
              '# or\n' +
              'brew install openai-whisper',
          },
        ],
      }
    }

    // Extract content
    console.log(`[extract-youtube] Starting content extraction...`)

    // Add timeout to prevent hanging
    const extractionPromise = extractYouTubeContent(url, {
      includeTitle: includeTitle ?? true,
      includeDescription: includeDescription ?? true,
      includeTranscript: includeTranscript ?? false,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Extraction timeout after 60 seconds')), 60000)
    })

    const result = await Promise.race([extractionPromise, timeoutPromise])
    console.log(`[extract-youtube] Content extraction completed successfully`)

    // Create a formatted text output
    let formattedOutput = '🎬 YouTube Content Extraction Results\n'
    formattedOutput += `${'='.repeat(50)}\n\n`

    // Video Information Section
    if (result.title || result.uploader) {
      formattedOutput += '📺 Video Information:\n'
      if (result.title) {
        formattedOutput += `   📝 Title: ${result.title}\n`
      }
      if (result.uploader) {
        formattedOutput += `   👤 Channel: ${result.uploader}\n`
      }
      if (result.duration) {
        formattedOutput += `   ⏱️  Duration: ${formatDuration(result.duration)}\n`
      }
      if (result.uploadDate) {
        formattedOutput += `   📅 Upload Date: ${formatUploadDate(result.uploadDate)}\n`
      }
      if (result.viewCount) {
        formattedOutput += `   👀 Views: ${formatNumber(result.viewCount)}\n`
      }
      if (result.likeCount) {
        formattedOutput += `   👍 Likes: ${formatNumber(result.likeCount)}\n`
      }
      formattedOutput += '\n'
    }

    // Description Section
    if (result.description) {
      formattedOutput += '📄 Description:\n'
      // Truncate very long descriptions
      const maxDescLength = 1000
      const description =
        result.description.length > maxDescLength
          ? `${result.description.substring(0, maxDescLength)}...`
          : result.description
      formattedOutput += `${description}\n\n`
    }

    // Tags and Categories
    if (result.tags && result.tags.length > 0) {
      formattedOutput += '🏷️  Tags:\n'
      formattedOutput += `   ${result.tags.slice(0, 10).join(', ')}${result.tags.length > 10 ? '...' : ''}\n\n`
    }

    if (result.categories && result.categories.length > 0) {
      formattedOutput += '📂 Categories:\n'
      formattedOutput += `   ${result.categories.join(', ')}\n\n`
    }

    // Transcript Section
    if (result.transcript) {
      formattedOutput += `📜 Transcript (${result.transcriptSource}):\n`

      // Add source-specific information
      if (result.transcriptSource === 'whisper') {
        formattedOutput += `   🤖 Whisper Model: ${result.whisperModel || 'unknown'}\n`
        if (result.detectedLanguage) {
          formattedOutput += `   🌐 Detected Language: ${result.detectedLanguage}\n`
        }
      } else if (result.transcriptSource === 'subtitles') {
        if (result.detectedLanguage) {
          formattedOutput += `   🌐 Subtitle Language: ${result.detectedLanguage}\n`
        }
      }

      formattedOutput += `   ${'-'.repeat(40)}\n`

      // Truncate very long transcripts for readability
      const maxTranscriptLength = 3000
      const transcript =
        result.transcript.length > maxTranscriptLength
          ? `${result.transcript.substring(0, maxTranscriptLength)}\n\n   [Transcript truncated for display...]`
          : result.transcript

      formattedOutput += `   ${transcript.replace(/\n/g, '\n   ')}\n\n`
    }

    // Footer
    formattedOutput += '🔗 Source URL:\n'
    formattedOutput += `   ${url}\n\n`
    formattedOutput += `⏰ Extracted at: ${new Date().toISOString()}\n\n`

    // Limit total response size to prevent issues
    const maxResponseSize = 50000 // 50KB limit
    if (formattedOutput.length > maxResponseSize) {
      formattedOutput = `${formattedOutput.substring(0, maxResponseSize)}\n\n[Response truncated due to size limit]`
    }

    return {
      content: [
        {
          type: 'text',
          text: formattedOutput,
        },
      ],
    }
  } catch (error) {
    console.error(`[extract-youtube] Error occurred:`, error)
    console.error(`[extract-youtube] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')

    return {
      content: [
        {
          type: 'text',
          text: `❌ Error extracting YouTube content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    }
  }
}
