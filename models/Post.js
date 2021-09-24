const { cleanObject } = require("../modules/Utils")

class Post {
  #transformations = [onlyString, lower]
  #allowedFields = ['title', 'body']

  constructor(data) {
    this.data = data
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

  }

  async create() {
    this.cleanUp()
    this.data.createDate = new Date()
    //this.validate()
  }

}

function onlyString(val) {
  return typeof val !== 'string' ? '' : val
}

function lower(val) {
  return typeof val === 'string' ? val.toLowerCase() : val
}

module.exports = Post