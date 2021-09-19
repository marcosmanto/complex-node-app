const mongodb = require('mongodb')

const connectionString = 'mongodb://127.0.0.1/ComplexApp'

mongodb.MongoClient.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true},
  (err, client) => {
    if( err && err.stack.toLowerCase().includes('timeout')) {
      console.log('Connection timeout. Check if mongodb server is running.')
      process.exit(0)
    }

    const db =  client.db()

    if (db) console.log('Connected to database.')

    module.exports = db

    const app = require('./app')
    app.listen(3000)
  }
)