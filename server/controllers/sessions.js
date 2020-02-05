const express = require('express')
const router = express.Router()
const oauth = require('oauth')
const logger = require('morgan')

const consumer = new oauth.OAuth(
  'https://twitter.com/oauth/request_token',
  'https://twitter.com/oauth/access_token',
  process.env.TWITTER_CONSUMER_KEY,
  process.env.TWITTER_CONSUMER_SECRET,
  '1.0A',
  process.env.TWITTER_CALLBACK_URL,
  'HMAC-SHA1'
)

router.get('/user_data', (req, res) => {
  let userData = { name: 'Anonymous' }
  consumer.get(
    'https://api.twitter.com/1.1/account/verify_credentials.json',
    req.session.oauthAccessToken,
    req.session.oauthAccessTokenSecret,
    function(error, data) {
      if (error) {
        console.log('Session is expired', error)
      } else {
        userData = JSON.parse(data)
        userData.handle = userData.screen_name
        req.session.handle = userData.screen_name
        req.session.socialType = 'twitter'
      }
      res.json(userData)
    }
  )
})

router.get('/connect', (req, res) => {
  consumer.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret) {
    if (error) {
      res.status(500).send(error)
    } else {
      req.session.oauthRequestToken = oauthToken
      req.session.oauthRequestTokenSecret = oauthTokenSecret
      res.redirect(
        'https://twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken
      )
    }
  })
})

router.get('/twitter_callback', (req, res) => {
  consumer.getOAuthAccessToken(
    req.query.oauth_token,
    req.session.oauthRequestTokenSecret,
    req.query.oauth_verifier,
    (error, oauthAccessToken, oauthAccessTokenSecret) => {
      if (error) {
        logger.error(error)
        res.status(500).send(error)
      } else {
        req.session.oauthAccessToken = oauthAccessToken
        req.session.oauthAccessTokenSecret = oauthAccessTokenSecret
        res.redirect('/make-contribution')
      }
    }
  )
})

module.exports = router
