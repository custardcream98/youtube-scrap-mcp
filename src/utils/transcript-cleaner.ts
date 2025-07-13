const splitIntoSentences = (text: string): string[] =>
  text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)

const removeDuplicates = (sentences: string[]): string[] => [...new Set(sentences)]

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const hasRepetitivePattern = (sentence: string): boolean => {
  const words = normalizeText(sentence).split(' ')

  if (words.length <= 6) return false

  const midPoint = Math.floor(words.length / 2)
  const firstHalf = words.slice(0, midPoint).join(' ')
  const secondHalf = words.slice(midPoint).join(' ')

  return firstHalf.length > 10 && secondHalf.includes(firstHalf)
}

const extractFirstHalf = (sentence: string): string => {
  const words = normalizeText(sentence).split(' ')
  const midPoint = Math.floor(words.length / 2)
  return words.slice(0, midPoint).join(' ')
}

const removeRepetitivePatterns = (sentences: string[]): string[] => {
  const cleanedSentences: string[] = []
  const seenPatterns = new Set<string>()

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence)

    if (seenPatterns.has(normalized)) continue

    if (hasRepetitivePattern(sentence)) {
      const firstHalf = extractFirstHalf(sentence)
      cleanedSentences.push(firstHalf)
      seenPatterns.add(normalizeText(firstHalf))
    } else {
      cleanedSentences.push(sentence)
      seenPatterns.add(normalized)
    }
  }

  return cleanedSentences
}

export const cleanTranscript = (text: string): string => {
  if (!text) return ''

  const sentences = splitIntoSentences(text)
  const uniqueSentences = removeDuplicates(sentences)
  const cleanedSentences = removeRepetitivePatterns(uniqueSentences)

  return cleanedSentences.join('. ').trim()
}
