const { google } = require('googleapis');
const { pool } = require('./dbConfig');
const { getUserDetails} = require('./getUserDetails');
const { OAuth} = google.auth;
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);


const getAuthUrl =  () => {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];
      return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
      });
}
  
const setCredentials = (code) => {
      return oauth2Client.getToken(code).then(({ tokens }) => {
        oauth2Client.setCredentials(tokens);
        return tokens;
      });
}
  
const listMessages=  () => {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      return gmail.users.messages.list({ userId: 'me' }).then((res) => res.data);
}



oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

async function checkEmails() {
    try {
      const users = await pool.query(`SELECT id, access_token, refresh_token FROM users WHERE access_token IS NOT NULL`);

      for (const user of users.rows){
        oauth2Client.setCredentials({
          access_token: user.access_token,
          refresh_token: user.refresh_token,
        });

        const gmail = google.gmail({version: 'v1', auth: oauth2Client});
        const messagesResponse = await gmail.users.messages.list({
          userId: 'me',
          q: 'is:unread'
        });

        if (messagesResponse.data.messages && messagesResponse.data.messages.length > 0){
          const jobApplications = await pool.query(
            `SELECT id, company FROM job_applications WHERE user_id = $1 AND status = $2`,
            [user.id, 'Not Answered']
          );

          for (const message of messagesResponse.data.messages){
            const messageId = message.id;
            const email = await gmail.users.messages.get({userId:'me', id: messageId});

            const emailContent = email.data.snippet.toLowerCase();

            for (const application of jobApplications.rows){
              if (emailContent.includes(application.company.toLowerCase())){
                await pool.query(
                  `UPDATE job_applications SET status = $1 WHERE id = $2`,
                  ['Answered', application.id]
                );
                break;
              }
            }
          }
        }
      } 
    } catch (error){
      console.log('Error checking emails', error);
    }
}

setInterval(checkEmails, 60000); 

module.exports = { 
  checkEmails,
  getAuthUrl,
  setCredentials,
  listMessages 
};


