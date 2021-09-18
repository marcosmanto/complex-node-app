exports.login = function() {

}

exports.logout = function() {

}

exports.register = function(req, res) {
  res.send('THANKS')
}

exports.home = (req, res) => {
  res.render('home-guest')
}