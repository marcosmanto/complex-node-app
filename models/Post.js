const { cleanObject } = require('../modules/Utils')
const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')
const { ObjectId } = require('bson')
const UserES6 = require('./UserES6')
const sanitizeHTML = require('sanitize-html')

// create indexes for text search if they not exist
postsCollection.createIndex({
  title: 'text',
  body: 'text',
})

class Post {
  #allowedFields = ['title', 'body']
  #transformations = [onlyString, trimVal, sanitizeVal]

  constructor(data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
  }

  // Static methods

  static async getFeed(id) {
    // create an array of the users ids that current user follow
    let followedUsers = await followsCollection.find({ authorId: new ObjectId(id) }).toArray()
    followedUsers = followedUsers.map(followDoc => followDoc.followedId)

    // look for posts where the author is in the above array of followed users
    return Post.reusablePostQuery([{ $match: { author: { $in: followedUsers } } }, { $sort: { createdDate: -1 } }])
  }

  static search(searchTerm) {
    return new Promise(async (resolve, reject) => {
      if (typeof searchTerm === 'string') {
        try {
          let posts = await Post.reusablePostQuery([{ $match: { $text: { $search: searchTerm } } }], undefined, [{ $sort: { score: { $meta: 'textScore' } } }])
          resolve(posts)
        } catch (error) {
          reject(error)
        }
      } else {
        reject()
      }
    })
  }

  static reusablePostQuery(uniqueOperations, visitorId, finalOperations = []) {
    return new Promise(async (resolve, reject) => {
      let aggOperations = uniqueOperations
        .concat([
          { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' } },
          {
            $project: {
              title: 1,
              body: 1,
              createdDate: 1,
              authorId: '$author',
              author: { $arrayElemAt: ['$authorDocument', 0] },
            },
          },
        ])
        .concat(finalOperations)

      try {
        let posts = await postsCollection.aggregate(aggOperations).toArray()
        posts = posts.map(post => {
          post.isVisitorOwner = post.authorId.equals(visitorId)
          post.authorId = undefined
          post.author = cleanObject(post.author, ['username', 'email'])
          post.author.avatar = UserES6.getAvatar(post.author.email)
          return post
        })
        resolve(posts)
      } catch (error) {
        console.log(error)
        resolve([])
        return
      }
    })
  }

  static async countPostsByAuthor(id) {
    try {
      return await postsCollection.countDocuments({ author: id })
    } catch {
      throw new Error('Failed to get posts count.')
    }
  }

  static findByAuthorId(authorId) {
    return Post.reusablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }])
  }

  static findSingleById(id, visitorId) {
    return new Promise(async (resolve, reject) => {
      if (typeof id !== 'string' || !ObjectId.isValid(id)) {
        reject()
        return
      }

      let posts = await Post.reusablePostQuery([{ $match: { _id: new ObjectId(id) } }], visitorId)

      if (posts.length) {
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
    if (typeof this.data.title !== string) {
      this.data.title = ''
    }
    if (typeof this.data.body !== string) {
      this.data.body = ''
    }

    // remove extra post variables from user
    this.data = {
      title: this.data.title,
      body: this.data.body,
      createdDate: new Date(),
    }
  }

  validate() {
    if (!this.data.title || this.data.title === '') {
      this.errors.push('You must provide a title.')
    }
    if (!this.data.body || this.data.body === '') {
      this.errors.push('You must provide post content.')
    }
  }

  create() {
    return new Promise((resolve, reject) => {
      this.cleanUp()
      this.validate()
      if (!this.errors.length) {
        this.data.createdDate = new Date()
        this.data.author = new ObjectId(this.userid)
        // save post into database
        postsCollection
          .insertOne(this.data)
          .then(info => {
            resolve(info.insertedId.toString())
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

  async delete() {
    return new Promise(async (resolve, reject) => {
      try {
        let post = await Post.findSingleById(this.requestedPostId, this.userid)
        if (post.isVisitorOwner) {
          // owner of the post safelly update post
          await postsCollection.deleteOne({ _id: post._id })
          resolve(this)
        } else {
          reject('You do not have permission to perform that action.')
        }
      } catch {
        reject('Post not found.')
      }
    })
  }

  async updateInDatabase() {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({ _id: new ObjectId(this.requestedPostId) }, { $set: { title: this.data.title, body: this.data.body } })
    }
  }

  update() {
    return new Promise(async (resolve, reject) => {
      try {
        let post = await Post.findSingleById(this.requestedPostId, this.userid)
        if (post.isVisitorOwner) {
          // owner of the post safelly update post
          await this.updateInDatabase()
          resolve(this)
        } else {
          reject()
        }
      } catch {
        reject()
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

function sanitizeVal(val) {
  return sanitizeHTML(val, { allowedTags: [], allowedAttributes: {} })
}

module.exports = Post
