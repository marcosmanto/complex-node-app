const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const csrf = require('csurf')
const sanitizeHTML = require('sanitize-html')
const app = express()

const sessionOptions = session({
  secret: 'Javascript is sooooooooo cooooooollllll',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
  },
  store: MongoStore.create({ client: require('./db') }),
})

app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(sessionOptions)
app.use(flash())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use((req, res, next) => {
  // make markdown available inside ejs views
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), { allowedTags: ['p', 'br', 'ul', 'li', 'ol', 'strong', 'bold', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {} })
  }
  //make all error ans success flash messages available from all views
  res.locals.errors = req.session.flash !== undefined ? req.flash('errors') : []
  res.locals.success = req.session.flash !== undefined ? req.flash('success') : []

  // make current user id available on the req object
  if (req.session.user) {
    req.visitorId = req.session.user._id
  } else {
    req.visitorId = 0
  }
  // make user session data available from within view templates
  res.locals.user = req.session.user
  next()
})

const router = require('./router')

app.use(csrf())

app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use('/', router)

app.use((err, req, res, next) => {
  if (err) {
    if (err.code === 'EBADCSRFTOKEN') {
      req.flash('errors', 'Cross site request forgery detected.')
      req.session.save(() => res.redirect('/'))
    } else {
      res.render('404')
    }
  }
})

const server = require('http').createServer(app)

const io = require('socket.io')(server)

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})

io.on('connection', socket => {
  // only accepts socket messages if user is logged in
  if (socket.request.session.user) {
    let user = socket.request.session.user

    // emit only once when a connection is established
    // send back to the client information about user session data (username and avatar)
    socket.emit('welcome', { username: user.username, avatar: user.avatar })

    socket.on('chatMessageFromBrowser', data => {
      // socket.emit send data only to this connection, io.emit send to all active connections
      // socket.broadcast.emit send to all connections except the message sender
      socket.broadcast.emit('chatMessageFromServer', { message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: {} }), username: user.username, avatar: user.avatar })
    })
  }
})

module.exports = server
