const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
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

app.set('views','views')
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(sessionOptions)
app.use(flash())
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use((req, res, next) => {
  res.locals.user = req.session.user
  next()
})

const router = require('./router')
app.use('/', router)

module.exports = app