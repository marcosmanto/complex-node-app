const validator = require('validator')
const userCollection = require('../db').collection('users')
let User = function (data) {
  this.data = data
  this.errors = []
}

User.prototype.validate = function () {
  if (this.data.username === '') {
    this.errors.push('You must provide a username.')
  }
  if (this.data.username !== '' && !validator.isAlphanumeric(this.data.username)) {
    this.errors.push('Username can only contains letters and numbers.')
  }
  if (!validator.isEmail(this.data.email)) {
    this.errors.push('You must provide a valid email address.')
  }
  if (this.data.password === '') {
    this.errors.push('You must provide a password.')
  }
  if (this.data.password.length > 0 && this.data.password < 12) {
    this.errors.push(`Password must be at least 12 characters.`)
  }
  if (this.data.password.length > 100) {
    this.errors.push(`Password cannot exceed 100 characters.`)
  }
  if (this.data.username.length > 0 && this.data.username < 3) {
    this.errors.push(`Username must be at least 3 characters.`)
  }
  if (this.data.username.length > 30) {
    this.errors.push(`Username cannot exceed 30 characters.`)
  }
}

User.prototype.cleanUp = function() {
  if(typeof(this.data.username) !== 'string') {
    this.data.username = ''
  }
  if(typeof(this.data.email) !== 'string') {
    this.data.email = ''
  }
  if(typeof(this.data.password) !== 'string') {
    this.data.password = ''
  }

  // get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

User.prototype.register = async function () {
  // 1) Validate and clean up user data
  this.cleanUp()
  this.validate()

  // 2) Only if there are no validation errors
  // then save the user data into a database
  if(!this.errors.length) {
    let newUser
    try {
      newUser = await userCollection.insertOne(this.data)
    } catch (error) {
      this.errors.push(`There was a problem registering user in the database.`)
    }

  }
}

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    userCollection.findOne({username: this.data.username})
      .then(attemptedUser => {
        if(attemptedUser && attemptedUser.password === this.data.password) {
          resolve('Congrats 🥳.')
        } else {
          reject('Invalid username or password.')
        }
      })
      .catch(() => reject('Please try again later.'))
  })
}

module.exports = User
