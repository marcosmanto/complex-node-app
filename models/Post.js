const { cleanObject } = require("../modules/Utils")
const postsCollection = require('../db').db().collection('posts')
class Post {
  #allowedFields = ['title', 'body']
  #transformations = [onlyString, lower]

  constructor(data) {
    this.data = data
    this.errors = []
  }

  cleanUp() {
    this.data = cleanObject(this.data, this.#allowedFields, this.#transformations)
    console.log(`post data cleaned`)
  }

  cleanUpOld() {
    if(typeof this.data.title !== string) { this.data.title = '' }
    if(typeof this.data.body !== string) { this.data.body = '' }

    // remove extra post variables from user
    this.data = {
      title: this.data.title,
      body: this.data.body,
      createDate: new Date()
    }
  }

  validate() {
    if(this.data.title === '') { this.errors.push('You must provide a title.')}
    if(this.data.body === '') { this.errors.push('You must provide post content.')}
  }

  create() {
    return new Promise((resolve, reject) => {
      this.cleanUp()
      this.validate()
      if(!this.errors.length) {
        this.data.createDate = new Date()
        // save post into database
        postsCollection.insertOne(this.data)
          .then(() => {
            resolve()
          })
          .catch(() => {
            this.errors.push('Please try again later.')
            reject(this.errors)
          })
      } else {
        reject(this.errors)
      }
    })
  }

}

function onlyString(val) {
  return typeof val !== 'string' ? '' : val
}

function lower(val) {
  return typeof val === 'string' ? val.toLowerCase() : val
}

module.exports = Post