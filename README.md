# Slack Web Data Connector for Tableau

How to use this connector:

1. Create a new [Slack App](https://api.slack.com/apps?new_app=1) to get an API key.
2. The app needs the following scopes: `channels:read` and `users:read`.
3. Set the OAuth redirect URIs in the slack app you just created.
4. Create a copy of `config_template.js` as `config.js` and replace with the appropriate values.
5. `npm start`
