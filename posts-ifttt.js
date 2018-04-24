const { MongoClient } = require('mongodb')

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

const savePost = post => db =>
  new Promise((resolve, reject) => {
    db
      .collection('auth0_posts')
      .save(post, (error) => {
        if (error) {
          return reject(error)
        }

        resolve(`Successfully saved a new post by ${post.from}`)
      })
  })

module.exports = ({ data }, done) => {
  if (
    data.message
    && !data.message.includes('Auth0')
  ) {
    return done(null)
  }

  const post = {
    from: data.from,
    message: data.message,
    updatedAt: data.updatedAt
  }

  openMongoConnection(data.MONGO_URL)
    .then(savePost(post))
    .then(message => done(null, message))
    .catch(done)
}
