//const User = require("../models/User")
const User = require('../models/UserES6')

exports.mustBeLoggedIn = function(req, res, next) {
  if(req.session.user) {
    next()
  } else {
    req.flash('errors', 'You must be logged in to perform that action.')
    req.session.save(() => res.redirect('/'))
  }
}

exports.login = function(req, res) {
  let user = new User(req.body)
  user.login().then(result => {
    req.session.user = {avatar: user.avatar, username: user.data.username}
    req.session.save(() => res.redirect('/'))
  }).catch(e => {
    // - if error object has errors property send it else sen just error (defaults to message)
    //res.send(e?.errors ?? e)
    req.flash('errors', e?.errors ?? e)
    req.session.save(() => res.redirect('/'))
  })
}

exports.logout = function(req, res) {
  req.session.destroy(() => {
    res.redirect('/')
  })
}

exports.register = async function(req, res) {
  let user = new User(req.body)

  try {
    await user.register()
    req.session.user = {username: user.data.username, avatar: user.avatar}
    req.session.save(() => res.redirect('/'))
  } catch(regErrors) {
    regErrors.forEach((error) => {
      req.flash('regErrors', error)
    })
    req.session.save(() => res.redirect('/'))
  }

}

exports.home = (req, res) => {
  if(req.session.user) {
    res.render('home-dashboard')
  } else {
    res.render('home-guest', {
      // Only pass flash messages if flash was initialized and populated
      // Without this check session is saved to database when user gets to the home page
      errors: req.session.flash !== undefined ? req.flash('errors') : [],
      regErrors: req.session.flash !== undefined ? req.flash('regErrors') : []
    })
    if(req.session.flash)
      req.session.destroy()
  }
}