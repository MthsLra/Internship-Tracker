const { google } = require('googleapis');
const { OAuth2 } = google.auth;


async function getToken(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

module.exports = {
  getToken,
};
