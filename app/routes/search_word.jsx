import words from 'an-array-of-spanish-words'
import { json } from 'remix'
export const loader = ({ request }) => {
  let url = new URL(request.url)
  let maybeWord = url.searchParams.get('q')
  const exists = !!words.find(word => word === maybeWord)
  return json({
    exists
  })
}
