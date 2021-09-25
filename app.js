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
  //make all error ans success flash messages available from all views
  res.locals.errors = req.session.flash !== undefined ? req.flash('errors') : []
  res.locals.success = req.session.flash !== undefined ? req.flash('success') : []

  // make current user id available on the req object
  if(req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }
  // make user session data available from within view templates
  res.locals.user = req.session.user
  next()
})

const router = require('./router')
app.use('/', router)

module.exports = app