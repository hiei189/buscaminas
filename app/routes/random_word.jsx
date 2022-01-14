import { json } from 'remix'
import words from '~/lib/words'
export const loader = () => {
  const filteredWords = words.filter(word => word.length === 5)
  const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)]
  return json(randomWord)
}
