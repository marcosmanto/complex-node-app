const Post = require('../models/Post')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY)

exports.viewCreateScreen = function (req, res) {
  res.render('create-post')
}

exports.create = function (req, res) {
  const post = new Post(req.body, req.session.user._id)
  post
    .create()
    .then(postid => {
      //res.json(post.data) // send json post data
      /*
      sendgrid
        .send({
          to: '',
          from: '',
          subject: 'Congrats on creating a new post!',
          text: 'You did a great job of creating a post.',
          html: '<h1>You did a <strong>great job</strong> of creating a post.</h1>',
        })
        .catch(error => console.log(error.response.body))
      */
      req.flash('success', 'New post successfully created.')
      req.session.save(() => res.redirect(`/post/${postid}`))
    })
    .catch(errors => {
      errors.forEach(error => req.flash('errors', error))
      req.session.save(() => res.redirect('/create-post'))
    })
}

exports.apiCreate = function (req, res) {
  const post = new Post(req.body, req.apiUser._id)
  post
    .create()
    .then(postid => {
      res.json('Congrats.')
    })
    .catch(errors => {
      res.json(errors)
    })
}

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post, title: post.title })
  } catch {
    res.render('404')
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render('edit-post', { post })
    } else {
      req.flash('errors', 'You do not have permission to perform that action')
      req.session.save(() => res.redirect('/'))
    }
  } catch {
    res.render('404')
  }
}

exports.edit = async function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)
  try {
    post = await post.update()
    // there were validation errors?
    if (!post.errors.length) {
      // success
      req.flash('success', 'Post successfully updated.')
      req.session.save(() => res.redirect(`/post/${post.requestedPostId}/edit`))
    } else {
      // validation fails send to home and display
      post.errors.forEach(err => req.flash('errors', err))
      req.session.save(() => res.redirect(`/post/${req.params.id}/edit`))
    }
  } catch {
    // post with the requested id doesn't exist
    // or if the current visitor is not the owner of the requested post
    req.flash('errors', 'You do not have permission to perform that action')
    req.session.save(() => res.redirect('/'))
  }
}

exports.delete = async function (req, res) {
  let post = new Post(undefined, req.visitorId, req.params.id)
  try {
    await post.delete()
    req.flash('success', 'Post successfully deleted.')
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  } catch (error) {
    // post with the requested id doesn't exist
    // or if the current visitor is not the owner of the requested post
    req.flash('errors', error)
    req.session.save(() => res.redirect('/'))
  }
}

exports.apiDelete = async function (req, res) {
  let post = new Post(undefined, req.apiUser._id, req.params.id)
  try {
    await post.delete()
    res.json('Success.')
  } catch (error) {
    res.json('You do not have permission to perform thar action.')
  }
}

exports.search = function (req, res) {
  Post.search(req.body.searchTerm)
    .then(posts => {
      res.json(posts)
    })
    .catch(error => {
      console.log(error)
      res.json([])
    })
}
