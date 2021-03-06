const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

const postsCollection = require('./db').db().collection('posts')

router.get('/indexes', async function(req, res) {
  // show indexes of post collection returned as json
  // to drop a index use: postsCollection.dropIndex("namehere")
  const indexes = await postsCollection.indexes()
  res.json(indexes)
})

// user related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

// profile related route
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData , userController.profilePostsScreen)
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData , userController.profileFollowersScreen)
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData , userController.profileFollowingScreen)

// post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen)
router.post('/create-post', userController.mustBeLoggedIn, postController.create)
router.get('/post/:id', postController.viewSingle)
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen)
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit)
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete)
router.post('/search', postController.search)
router.post('/doesUsernameExist', userController.doesUsernameExist)
router.post('/doesEmailExist', userController.doesEmailExist)

// follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn , followController.addFollow)
router.post('/removeFollow/:username', userController.mustBeLoggedIn , followController.removeFollow)

module.exports = router
