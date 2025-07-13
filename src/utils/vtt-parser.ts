import { readFile } from 'fs/promises'

const isWebVTTHeader = (line: string): boolean => line === 'WEBVTT'
const isEmpty = (line: string): boolean => line === ''
const isTimestamp = (line: string): boolean => line.includes('-->')
const isLineNumber = (line: string): boolean => /^\d+$/.test(line)
const isCueSetting = (line: string): boolean => line.includes('align:') || line.includes('position:')

const removeHtmlTags = (text: string): string => text.replace(/<[^>]*>/g, '')

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')

const cleanSubtitleText = (text: string): string => {
  const withoutTags = removeHtmlTags(text)
  const decoded = decodeHtmlEntities(withoutTags)
  return decoded.trim()
}

const extractTextLines = (lines: string[]): string[] => {
  const textLines: string[] = []
  let isTextLine = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip WEBVTT header and empty lines
    if (isWebVTTHeader(trimmedLine) || isEmpty(trimmedLine)) {
      continue
    }

    // Skip timestamp lines (format: 00:00:00.000 --> 00:00:02.000)
    if (isTimestamp(trimmedLine)) {
      isTextLine = true
      continue
    }

    // Skip cue settings and numbers
    if (isLineNumber(trimmedLine) || isCueSetting(trimmedLine)) {
      continue
    }

    // Extract actual subtitle text
    if (isTextLine && trimmedLine) {
      const cleanText = cleanSubtitleText(trimmedLine)
      if (cleanText) {
        textLines.push(cleanText)
      }
    }
  }

  return textLines
}

const normalizeSpaces = (text: string): string => text.replace(/\s+/g, ' ').trim()

export const parseVTTFile = async (filePath: string): Promise<string> => {
  try {
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    const textLines = extractTextLines(lines)
    const joinedText = textLines.join(' ')

    return normalizeSpaces(joinedText)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to parse VTT file: ${errorMessage}`)
  }
}
