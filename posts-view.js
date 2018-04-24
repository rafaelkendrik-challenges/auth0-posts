const { MongoClient } = require('mongodb')
const handlebars = require('handlebars')

const openMongoConnection = mongoUrl =>
  new Promise((resolve, reject) => {
    MongoClient.connect(mongoUrl, (error, database) => {
      if (error) {
        return reject(error)
      }

      const db = database.db('my_posts')
      resolve(db)
    })
  })

const formatPosts = posts => 
  posts
    .reverse()
    .map(({ from, message, updatedAt }) => ({
      from: from.trim(),
      message: message.trim(),
      updatedAt: updatedAt.trim()
    }))

const getPosts = db =>
  new Promise((resolve, reject) => {
    db
      .collection('auth0_posts')
      .find()
      .toArray((error, posts) => {
        if(error) {
          return reject(error)
        }

        resolve(formatPosts(posts))
      })
  })

const mountErrorTemplate = posts => {
  const View = `
  <html>
    <head>
      <title>404</title>
    </head>
    <body>
      404, Something went wrong!
    </body>
  </html>
  `

  return handlebars.compile(View)
}

const mountPostsTemplate = posts => {
  const View = `
  <html>
    <head>
      <title>Auth0 posts</title>
      <style>
      .main-title {
        color: rgba(38,51,51,0.9);
        font-weight: lighter;
      }
      .post {
        list-style: none;
      }
      .post-item {
        border-left: 0.5rem solid #E0E3E3;
        color: #263333;
        padding: 0.5rem 1.5rem;
        margin: 1.5rem 0;
      }
      .post-item-title {
        color: rgba(38,51,51,0.9);
        font-weight: lighter;
      }
      .post-item-time {
        font-size: 0.8rem;
      }
      </style>
    </head>
    <body>
      <h1 class="main-title">My posts at Facebook for Auth0</h1>
      <ul class="post">
        {{#each posts}}
          <li class="post-item">
            <h2 class="post-item-title">{{message}}</h2>
            <span class="post-item-time">{{updatedAt}}</span>
          </li>
        {{/each}}
      </ul>
    </body>
  </html>
  `

  const template = handlebars.compile(View)
  return template({ posts })
}

return ({ data }, request, response) => {
  openMongoConnection(data.MONGO_URL)
    .then(getPosts)
    .then(mountPostsTemplate)
    .then(template => {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end(template)
    })
    .catch(error => {
      // ... throwing error to a backlog

      const template = mountErrorTemplate()

      response.writeHead(404, { 'Content-Type': 'text/html' })
      response.end(template())
    })
}
