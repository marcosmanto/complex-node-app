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
    let post = await Post.findSingleById(req.params.id)
    res.render('single-post-screen', { post })
  } catch {
    res.send('404 💣💥')
  }

}