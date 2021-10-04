//const User = require("../models/User")
const Post = require('../models/Post')
const User = require('../models/UserES6')
const Follow = require('../models/Follow')

exports.mustBeLoggedIn = function(req, res, next) {
  if(req.session.user) {
    next()
  } else {
    req.flash('errors', 'You must be logged in to perform that action.')
    req.session.save(() => res.redirect('/'))
  }
}

exports.login = function(req, res) {
  let user = new User(req.body)
  user.login().then(result => {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}
    req.session.save(() => res.redirect('/'))
  }).catch(e => {
    // - if error object has errors property send it else sen just error (defaults to message)
    //res.send(e?.errors ?? e)
    req.flash('errors', e?.errors ?? e)
    req.session.save(() => res.redirect('/'))
  })
}

exports.logout = function(req, res) {
  req.session.destroy(() => {
    res.redirect('/')
  })
}

exports.register = async function(req, res) {
  let user = new User(req.body)

  try {
    await user.register()
    req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
    req.session.save(() => res.redirect('/'))
  } catch(regErrors) {
    regErrors.forEach((error) => {
      req.flash('regErrors', error)
    })
    req.session.save(() => res.redirect('/'))
  }

}

exports.home = async (req, res) => {
  if(req.session.user) {
    // fetch feed of posts for current user
    const posts = await Post.getFeed(req.session.user._id)
    res.render('home-dashboard', {posts})
  } else {
    res.render('home-guest', {
      // Only pass flash messages if flash was initialized and populated
      // Without this check session is saved to database when user gets to the home page
      //errors: req.session.flash !== undefined ? req.flash('errors') : [],
      regErrors: req.session.flash !== undefined ? req.flash('regErrors') : []
    })
    if(req.session.flash)
      req.session.destroy()
  }
}

exports.ifUserExists = function(req, res, next) {
  User.findByUsername(req.params.username).then((userDocument) => {
    req.profileUser = userDocument
    next()
  }).catch(() => {
    res.render('404')
  })
}

exports.profilePostsScreen = function(req, res) {
  // get all posts from user
  Post.findByAuthorId(req.profileUser._id).then((posts) => {
    res.render('profile', {
      currentPage: 'profile',
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      posts,
      isFollowing: req.isFollowing,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  }).catch(() => {
    res.render('404')
  })
}

exports.profileFollowersScreen = async function(req, res) {
  try {
    const followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
      currentPage: 'profile-followers',
      followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  } catch {
    res.render('404')
  }
}

exports.profileFollowingScreen = async function(req, res) {
  try {
    const following = await Follow.getFollowingById(req.profileUser._id)
    res.render('profile-following', {
      currentPage: 'profile-following',
      following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  } catch {
    res.render('404')
  }
}

exports.sharedProfileData = async function(req, res, next) {
  let isFollowing = false
  if(req.session.user) {
    // is current user following this profile account? Ask database.
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  req.isFollowing = isFollowing
  // retrieve post, follower and following counts
  const postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  const followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  const followingCountPromise = Follow.countFollowingById(req.profileUser._id)

  const [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount

  next()
}