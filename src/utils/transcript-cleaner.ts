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

const removeConsecutiveWords = (text: string): string => {
  const words = text.split(' ')
  const result: string[] = []

  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i] !== words[i - 1]) {
      result.push(words[i])
    }
  }

  return result.join(' ')
}

const removeRepeatingSegments = (text: string): string => {
  const words = text.split(' ')
  const result = [...words]

  for (let segmentLength = 2; segmentLength <= 10; segmentLength++) {
    let changed = true

    while (changed) {
      changed = false

      for (let i = 0; i <= result.length - segmentLength * 2; i++) {
        const segment1 = result.slice(i, i + segmentLength)
        const segment2 = result.slice(i + segmentLength, i + segmentLength * 2)

        if (segment1.length === segment2.length && segment1.every((word, idx) => word === segment2[idx])) {
          result.splice(i + segmentLength, segmentLength)
          changed = true
          break
        }
      }
    }
  }

  return result.join(' ')
}

const removeTripleRepeats = (text: string): string => {
  const words = text.split(' ')

  for (let patternLength = 1; patternLength <= 15; patternLength++) {
    for (let i = 0; i <= words.length - patternLength * 3; i++) {
      const pattern1 = words.slice(i, i + patternLength)
      const pattern2 = words.slice(i + patternLength, i + patternLength * 2)
      const pattern3 = words.slice(i + patternLength * 2, i + patternLength * 3)

      if (
        pattern1.length === pattern2.length &&
        pattern2.length === pattern3.length &&
        pattern1.every((word, idx) => word === pattern2[idx] && word === pattern3[idx])
      ) {
        words.splice(i + patternLength, patternLength * 2)
        break
      }
    }
  }

  return words.join(' ')
}

const cleanRepeatedPhrases = (text: string): string =>
  removeConsecutiveWords(removeTripleRepeats(removeRepeatingSegments(removeConsecutiveWords(text))))

export const cleanTranscript = (text: string): string => {
  if (!text) return ''

  const cleaned = cleanRepeatedPhrases(text)
  const sentences = splitIntoSentences(cleaned)
  const uniqueSentences = removeDuplicates(sentences)
  const finalCleaned = removeRepetitivePatterns(uniqueSentences)

  return finalCleaned.join('. ').trim()
}
