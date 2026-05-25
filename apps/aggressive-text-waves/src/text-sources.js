export function parseWords (text) {
  return text.toUpperCase().split(/[ ,.;\n]+/).filter(w => w.length > 0)
}

export function createBundledSource ({ id, name, text }) {
  return {
    id,
    name,
    fetchWords: () => parseWords(text)
  }
}

export function createUserTextSource ({ getText }) {
  return {
    id: 'user-input',
    name: 'Custom Text',
    fetchWords: async () => {
      const text = await getText()
      if (!text) return null
      return parseWords(text)
    }
  }
}

const TUMBLR_BLOG = 'poeticalbot.tumblr.com'

export function createTumblrSource ({ random = Math.random } = {}) {
  return {
    id: 'tumblr',
    name: 'Tumblr',
    isNetworkSource: true,
    fetchWords: async () => {
      const apiKey = import.meta.env.VITE_TUMBLR_API_KEY
      const baseUrl = `https://api.tumblr.com/v2/blog/${TUMBLR_BLOG}/posts?api_key=${apiKey}&type=text`

      const infoRes = await fetch(baseUrl)
      if (!infoRes.ok) throw new Error(`Tumblr error: ${infoRes.status}`)
      const info = await infoRes.json()
      const total = info.response.total_posts
      const offset = Math.floor(random() * total)

      const postRes = await fetch(`${baseUrl}&offset=${offset}&limit=1`)
      if (!postRes.ok) throw new Error(`Tumblr error: ${postRes.status}`)
      const data = await postRes.json()
      const post = data.response.posts[0]
      if (!post) throw new Error('No post at offset')
      if (!post.body) throw new Error(`Non-text post type: ${post.type}`)

      const parser = new DOMParser()
      const doc = parser.parseFromString(post.body, 'text/html')
      const text = (doc.body.textContent || '').replace(/\s+/g, ' ')
      return parseWords(text)
    }
  }
}

export const BUNDLED_TEXTS = [
  {
    id: 'richard-iii',
    name: 'Richard III',
    text: `Now is the winter of our discontent
Made glorious summer by this sun of York;
And all the clouds that lour'd upon our house
In the deep bosom of the ocean buried.
Now are our brows bound with victorious wreaths;
Our bruised arms hung up for monuments;
Our stern alarums changed to merry meetings,
Our dreadful marches to delightful measures.
Grim-visaged war hath smooth'd his wrinkled front;
And now, instead of mounting barbed steeds
To fright the souls of fearful adversaries,
He capers nimbly in a lady's chamber
To the lascivious pleasing of a lute.`
  },
  {
    id: 'hamlet',
    name: 'Hamlet',
    text: `To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles
And by opposing end them. To die—to sleep,
No more; and by a sleep to say we end
The heartache and the thousand natural shocks
That flesh is heir to: 'tis a consummation
Devoutly to be wish'd. To die, to sleep;
To sleep, perchance to dream.`
  },
  {
    id: 'tempest',
    name: 'The Tempest',
    text: `Be not afeard; the isle is full of noises,
Sounds and sweet airs, that give delight and hurt not.
Sometimes a thousand twangling instruments
Will hum about mine ears; and sometimes voices
That, if I then had waked after long sleep,
Will make me sleep again: and then, in dreaming,
The clouds methought would open and show riches
Ready to drop upon me, that when I waked
I cried to dream again.`
  }
]
