const User = require("../models/User")


exports.login = function(req, res) {
  let user = new User(req.body)
  user.login(result => res.send(result))
}

exports.logout = function() {

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
  res.render('home-guest')
}