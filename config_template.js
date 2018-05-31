// Specify secret app credentials for Slack API here
// Template should be renamed to config.js and completed

var PORT = 8080;

var os = require("os");
var hostName = os.hostname();
var redirectUri = "http://" + hostName + ":" + PORT + "/callback";

module.exports = {
 'PORT': PORT,
 'CLIENT_ID': 'x',
 'CLIENT_SECRET': 'x',
 'REDIRECT_URI': redirectUri
};
