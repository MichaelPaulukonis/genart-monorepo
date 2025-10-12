import axios from 'axios'

const postCount = 20

const cleanup = text => text.replace(/\s+/g, ' ').replace(/–/g, '--')

const tumblrRandomPost = () => {
  const settings = {
    blogName: 'poeticalbot.tumblr.com',
    appKey: 'soMpL6oJLZq5ovoVYVzU5Qhx5DE87MMrxou6J7tGYLec6XeT6L',
    debug: false
  }
  return new Promise((resolve, reject) => {
    const apiUrl =
      'https://api.tumblr.com/v2/blog/' +
      settings.blogName +
      '/posts?api_key=' +
      settings.appKey
    axios
      .get(apiUrl)
      .then(
        // amazonq-ignore-next-line
        response => {
          const rndPost = Math.floor(
            Math.random() * response.data.response.total_posts
          )
          return rndPost
        },
        err => {
          reject(err)
        }
      )
      .then(postId =>
        axios
          .get(apiUrl + `&offset=${postId}&limit=${postCount}`)
          .then(response => {
            const newCorpus = response.data.response.posts.map(post => {
              const parser = new DOMParser()
              const doc = parser.parseFromString(post.body, 'text/html')
              return cleanup(doc.body.textContent || '')
            })
            resolve(newCorpus)
          })
      )
  })
}

export default tumblrRandomPost
