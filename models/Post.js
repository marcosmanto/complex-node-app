const { cleanObject } = require("../modules/Utils")
const postsCollection = require('../db').db().collection('posts')
const { ObjectId } = require("bson")
const UserES6 = require("./UserES6")

class Post {
  #allowedFields = ['title', 'body']
  #transformations = [onlyString, trimVal]

  constructor(data, userid) {
    this.data = data
    this.errors = []
    this.userid = userid
  }

  // Static methods

  static findByAuthorId(authorId) {
    return Post.reusablePostQuery([
      {$match: {author: authorId}},
      {$sort: {createdDate: -1}}
    ])
  }

  static reusablePostQuery(uniqueOperations) {
    return new Promise(async (resolve, reject) => {
      let aggOperations = uniqueOperations.concat([
        {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument'}},
        {$project: {
          title: 1,
          body: 1,
          createdDate: 1,
          author: {$arrayElemAt: ['$authorDocument', 0]}
        }}
      ])
      let posts = await postsCollection.aggregate(aggOperations).toArray()

      posts = posts.map(post => {
        post.author = cleanObject(post.author, ['username', 'email'])
        post.author.avatar = UserES6.getAvatar(post.author.email)
        return post
      })

      resolve(posts)
    })
  }

  static findSingleById(id) {
    return new Promise(async (resolve, reject) => {
      if(typeof(id) !== 'string' || !ObjectId.isValid(id)) {
        reject()
        return
      }

      let posts = await Post.reusablePostQuery([
        {$match: {_id: new ObjectId(id)}}
      ])

      if(posts.length) {
        resolve(posts.pop())
      } else {
        reject()
      }
    })
  }

  // Instance methods
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
      createdDate: new Date()
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
        this.data.createdDate = new Date()
        this.data.author = new ObjectId(this.userid)
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

function trimVal(val) {
  return typeof val === 'string' ? val.trim() : val
}

module.exports = Post