const { pool } = require('./dbConfig.js')


async function getUserDetails(){
    try {
        const result = await pool.query(`SELECT id, access_token, refresh_token FROM users WHERE access_token IS NOT NULL`);
        return result.rows;
    } catch (err) {
        console.error('Error fetching user details', err);
    }
}

module.exports = {
    getUserDetails,
};

