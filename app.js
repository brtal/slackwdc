/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * Slack.
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var config = require('./config.js');  // Get our config info (app id and app secret)
var path = require('path');

var client_id = process.env.CLIENT_ID || process.env.APPSETTING_CLIENT_ID || config.CLIENT_ID; // Your client sid
var client_secret = process.env.CLIENT_SECRET || process.env.APPSETTING_CLIENT_SECRET || config.CLIENT_SECRET; // Your secret
var redirect_uri = process.env.REDIRECT_URI || process.env.APPSETTING_REDIRECT_URI || config.REDIRECT_URI; // Your redirect uri
var port = process.env.PORT || process.env.APPSETTING_PORT || config.PORT;

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/schema', function(req, res) {
  res.sendfile(path.join(__dirname + '/public/schema.json'));
});

app.get('/auth', function(req, res) {
  // your application requests authorization
  res.redirect('https://slack.com/oauth/authorize?' +
    querystring.stringify({
      scope: 'channels:read users:read',
      client_id: client_id,
      redirect_uri: redirect_uri
    }));
});

app.get('/callback', function(req, res) {
  console.log("/callback called. Exchanging code for access token");
  var code = req.query.code || null;

  var url = 'https://slack.com/api/oauth.access?' +
    querystring.stringify({
      client_id: client_id,
      client_secret: client_secret,
      code: code,
      redirect_uri: redirect_uri
    });

  request.get(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = JSON.parse(body).access_token;
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token
        }));
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
  });
});

console.log('Listening on ' + port);
app.listen(port);
