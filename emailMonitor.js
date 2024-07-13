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

module.exports = {
    getAuthUrl: () => {
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ];
      return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
      });
    },
  
    setCredentials: (code) => {
      return oauth2Client.getToken(code).then(({ tokens }) => {
        oauth2Client.setCredentials(tokens);
        return tokens;
      });
    },
  
    listMessages: () => {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      return gmail.users.messages.list({ userId: 'me' }).then((res) => res.data);
    }
};

/*
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

async function checkEmails() {
    const users = await getUserDetails();

    for (const user of users) {
        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: user.access_token,
            refresh_token: user.refresh_token,
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread',
        });

        const messages = res.data.messages || [];

        for (const message of messages) {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
            });

            const emailData = msg.data;

            
            const fromHeader = emailData.payload.headers.find(
                (header) => header.name === 'From'
            );

            if (fromHeader) {
                const fromEmail = fromHeader.value;
                
                const companyEmails = ['mathis.lara@icloud.com', 'lraphilippe@gmail.com'];

                if (companyEmails.includes(fromEmail)) {
                    await pool.query(
                        `UPDATE job_applications SET status = 'Answered' WHERE user_id = $1 AND company_email = $2`,
                        [user.id, fromEmail]
                    );
                }
            }
        }
    }
}


async function updateApplicationStatus(companyDomain) {
  try {
    await pool.query(
      `UPDATE job_applications
       SET status = 'Answered'
       WHERE company = $1 AND user_id = $2`,
      [companyDomain, userId] 
    );
  } catch (error) {
    console.error('Error updating application status:', error);
  }
}


setInterval(checkEmails, 60000); 

module.exports = { checkEmails };

*/
