const { ObjectID } = require('bson')
const UserES6 = require('./UserES6')
const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')

class Follow {

  constructor(followedUsername, authorId) {
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
  }

  //Static methods

  static async isVisitorFollowing(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId, authorId: new ObjectID(visitorId)})
    return followDoc ? true : false
  }

  static async getFollowersById(userId) {
    try {
      let followers = await followsCollection.aggregate([
        {$match: {followedId: userId}},
        {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0]},
        }}
      ]).toArray()
      followers = followers.map(follower => {
        return { username: follower.username, avatar: UserES6.getAvatar(follower.email) }
      })
      return followers
    } catch {
      throw new Error('Failed to get followers.')
    }
  }

  cleanUp() {
    if(typeof(this.followedUsername) !== 'string') {
      this.followedUsername = ''
    }
  }

  async validate(action) {
    const followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if(followedAccount) {
      this.followedId = followedAccount._id
    } else {
      this.errors.push('You cannot follow a user that does not exist.')
    }

    const doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
    if(action === 'create') {
      if(doesFollowAlreadyExist) { this.errors.push('You are already following this user.') }
    }
    if(action === 'remove') {
      if(!doesFollowAlreadyExist) { this.errors.push('You cannot stop following someone you do not already follow.') }
    }

    // should not be able to follow yourself
    if(this.followedId.equals(new ObjectID(this.authorId))) {
      this.errors.push('You cannot follow yourself.')
    }
  }

  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp()
      await this.validate('create')
      if(!this.errors.length) {
        await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId) })
        resolve()
      } else {
        reject(this.errors)
      }
    })
  }

  remove() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp()
      await this.validate('remove')
      if(!this.errors.length) {
        await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId) })
        resolve()
      } else {
        reject(this.errors)
      }
    })
  }
}

module.exports = Follow