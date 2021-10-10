const mongodb = require('mongodb')

/* // remove dotenv for Heroku
const dotenv = require('dotenv')
dotenv.config()
*/

mongodb.MongoClient.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err && err.stack.toLowerCase().includes('timeout')) {
    console.log('Connection timeout. Check if mongodb server is running.')
    process.exit(0)
  }

  const db = client.db()

  if (db) console.log('Connected to database.')

  module.exports = client

  const app = require('./app')
  app.listen(process.env.PORT)
})
