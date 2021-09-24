const validator = require('validator')
const usersCollection = require('../db').db().collection('users')
const bcrypt = require(`bcryptjs`)
const md5 = require('md5')

class UserES6 {

  static ACTION = {
    REGISTER: 1,
    LOGIN: 2,
  }

  constructor(data) {
    this.data = data
    this.errors = []
    Object.freeze(this.constructor.ACTION);
  }

  validate(action) {
    return new Promise(
      async (resolve, reject) => {
        let usernameValid = true

        if (this.data.username === '') {
          usernameValid = false
          this.errors.push('You must provide a username.')
        }
        if (this.data.username !== '' && !validator.isAlphanumeric(this.data.username)) {
          usernameValid = false
          this.errors.push('Username can only contains letters and numbers.')
        }

        if (action === this.constructor.ACTION.REGISTER) {
          if(usernameValid) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            if(usernameExists) {
              this.errors.push('This username is already taken.')
            }
          }
          if (!validator.isEmail(this.data.email)) {
            this.errors.push('You must provide a valid email address.')
          } else {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if(emailExists) {
              this.errors.push('That email is already been used.')
            }
          }
        }

        if (this.data.password === '') {
          this.errors.push('You must provide a password.')
        }
        if (this.data.password.length > 0 && this.data.password.length < 8) {
          this.errors.push(`Password must be at least 8 characters.`)
        }
        if (this.data.password.length > 50) {
          this.errors.push(`Password cannot exceed 50 characters.`)
        }
        if (this.data.username.length > 0 && this.data.username.length < 3) {
          this.errors.push(`Username must be at least 3 characters.`)
        }
        if (this.data.username.length > 30) {
          this.errors.push(`Username cannot exceed 30 characters.`)
        }
        resolve()
      }
    )
  }

  cleanUp() {
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

  async register() {
    // - FUNCTIONS MARKED AS ASYNC IMPLICITLY RETURN A PROMISE.
    // HERE I'M USING EXPLICIT PROMISE RETURN.
    return new Promise(async (resolve, reject) => {

      // 1) Validate and clean up user data
      this.cleanUp()
      await this.validate(this.constructor.ACTION.REGISTER)

      // 2) Only if there are no validation errors
      // then save the user data into a database
      if(!this.errors.length) {
        let salt = bcrypt.genSaltSync(10)
        this.data.password = bcrypt.hashSync(this.data.password, salt)
        try {
          let newUser = await usersCollection.insertOne(this.data)
          this.getAvatar()
          this.data._id = newUser.insertedId.toString()
          resolve()
        } catch (error) {
          this.errors.push(`There was a problem registering user in the database.`)
          reject(this.errors)
        }
      } else {
        reject(this.errors)
      }

    })
  }

  login() {
    return new Promise((resolve, reject) => {
      this.cleanUp()
      this.validate(this.constructor.ACTION.LOGIN)
      if(this.errors.length) throw new ValidationException(this.errors)
      usersCollection.findOne({username: this.data.username})
        .then(attemptedUser => {
          if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
            this.data.email = attemptedUser.email
            this.data._id = attemptedUser._id
            this.getAvatar()
            resolve('Congrats 🥳.')
          } else {
            reject('Invalid username or password.')
          }
        })
        .catch(() => reject('Please try again later.'))
    })
  }

  getAvatar() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
  }

}

class ValidationException {
  constructor(errorsArr) {
    this.errors = errorsArr
    this.message = errorsArr.toString()
  }
  toString() {
    return this.message;
  }
}

module.exports = UserES6

