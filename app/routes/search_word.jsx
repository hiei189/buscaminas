import fullWords from '~/lib/full_words'
import { json } from 'remix'
export const loader = ({ request }) => {
  let url = new URL(request.url)
  let maybeWord = url.searchParams.get('q')
  const exists = !!fullWords.find(word => word === maybeWord)
  return json({
    exists
  })
}
