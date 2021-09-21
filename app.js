const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const app = express()

const sessionOptions = session({
  secret: "Javascript is sooooooooo cooooooollllll",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  },
  store: MongoStore.create({client: require('./db')})
})

app.use(sessionOptions)

const router = require('./router')

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(express.static('public'))
app.set('views','views')
app.set('view engine', 'ejs')
app.use('/', router)

module.exports = app