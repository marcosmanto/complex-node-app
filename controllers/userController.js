const User = require("../models/User")


exports.login = function(req, res) {
  let user = new User(req.body)
  user.login().then(result => {
    req.session.user = {favColor: 'blue', username: user.data.username}
    req.session.save(() => res.redirect('/'))
  }).catch(e => res.send(e?.errors ?? e)) //if error object has errors property send it else sen just error (defaults to message)
}

exports.logout = function(req, res) {
  req.session.destroy(() => {
    res.redirect('/')
  })
}

exports.register = async function(req, res) {
  let user = new User(req.body)

  await user.register()

  if (user.errors.length) {
    res.send(user.errors)
  } else {
    res.send('No validation errors.')
  }
}

exports.home = (req, res) => {
  if(req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username})
  } else {
    res.render('home-guest')
  }
}