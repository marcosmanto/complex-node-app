const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res) {
  res.render('create-post')
}

exports.create = function(req, res) {
  const post = new Post(req.body, req.session.user._id)
  post.create()
    .then(() => res.json(post.data))
    .catch(errors => res.send(errors))
}

exports.viewSingle = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post })
  } catch {
    res.render('404')
  }
}

exports.viewEditScreen = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id)
    res.render('edit-post', {post})
  } catch {
    res.render('404')
  }
}

exports.edit = async function(req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)
  try {
    post = await post.update()
    // there were validation errors?
    if(!post.errors.length) {
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