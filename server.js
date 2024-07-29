const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const cron = require('node-cron');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const { pool } = require('./dbConfig.js');
const bcrypt = require('bcrypt');
const initializePassport = require('./passportCOnfig.js');
const { checkEmails, getAuthUrl, setCredentials, listMessages } = require('./emailMonitor');

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Routes

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/users/main-connected', checkNotAuthenticated, async(req, res)=>{
    try {
        const results = await pool.query(
            'SELECT * FROM job_applications WHERE user_id = $1',
            [req.user.id]
        );
        res.render('main-connected.ejs', {jobApplications: results.rows});
    } catch (err) {
        console.error(err);
        res.send('Error retrieving job applications');
    }
});

app.get('/users/register', checkAuthenticated, (req, res) => {
    res.render('register.ejs');
});

app.get('/users/login', checkAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.get('/auth/google', (req, res) => {
    const url = getAuthUrl();
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    const oauth2Client = new OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        await pool.query(
            `UPDATE users SET access_token = $1, refresh_token = $2 WHERE id = $3`,
            [tokens.access_token, tokens.refresh_token, req.user.id]
        );
        res.redirect('/users/main-connected');
    } catch (err) {
        console.error('Error retrieving access token', err);
        res.send('Error during authentication');
    }
});

app.post('/users/activate-email-tracker', checkNotAuthenticated, (req, res) => {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokens = await setCredentials(code);
        await updateTokens(req.user.id, tokens.access_token, tokens.refresh_token);
        req.session.tokens = tokens;
        res.redirect('/users/main-connected');
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.redirect('/users/login');
    }
});

app.get('/users/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            console.error('Error logging out:', err);
            return next(err);
        }
        res.redirect('/users/login');
    });
});

app.post('/users/register', async (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ message: 'Please enter all fields' });
    }

    if (password.length < 6) {
        errors.push({ message: 'Password should be at least 6 characters' });
    }

    if (password !== password2) {
        errors.push({ message: 'Passwords do not match' });
    }

    if (errors.length > 0) {
        res.render('register', { errors });
    } else {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await createUser(name, email, hashedPassword);
            req.flash('success_msg', 'You are now registered. Please log in');
            res.redirect('/users/login');
        } catch (err) {
            console.error('Error registering user:', err);
            res.render('register', { errors: [{ message: 'Failed to register user' }] });
        }
    }
});

app.post('/users/main-connected', checkNotAuthenticated, async (req, res) => {
    const { role, company, salary } = req.body;
    let status = 'Not Answered';
    let errors = [];

    if (!role || !company || !salary) {
        errors.push({ message: "Please enter all fields" });
    }

    if (errors.length > 0) {
        try {
            const jobApplications = await getJobApplications(req.user.id);
            res.render('main-connected', { errors, user: req.user.name, jobApplications });
        } catch (err) {
            console.error('Error fetching job applications:', err);
            res.send('Error fetching the job applications');
        }
    } else {
        try {
            await addJobApplication(req.user.id, role, company, salary, status);
            const jobApplications = await getJobApplications(req.user.id);
            res.render('main-connected', { user: req.user.name, jobApplications, errors: [] });
        } catch (err) {
            console.error('Error adding job application:', err);
            res.send('Error adding job application');
        }
    }
});

app.delete('/users/main-connected/:id', checkNotAuthenticated, async (req, res) => {
    const { id } = req.params;
    try {
        await deleteJobApplication(id, req.user.id);
        res.redirect('/users/main-connected');
    } catch (err) {
        console.error('Error deleting job application:', err);
        res.send('Error deleting job application');
    }
});

app.post('/users/login', passport.authenticate('local', {
    successRedirect: '/users/main-connected',
    failureRedirect: '/users/login',
    failureFlash: true,
}));

app.post('/users/main-connected/add', checkNotAuthenticated, async (req, res) => {
    const { company_name, job_title, application_date, status } = req.body;
    try {
        await addJobApplication(req.user.id, company_name, job_title, application_date, status);
        res.redirect('/users/main-connected');
    } catch (err) {
        console.error('Error adding job application:', err);
        res.send('Error adding job application');
    }
});

cron.schedule('*/5 * * * *', async () => {
    console.log('Checking emails...');
    await checkEmails();
});

// Helper Functions

async function getJobApplications(userId) {
    const results = await pool.query('SELECT * FROM job_applications WHERE user_id = $1', [userId]);
    return results.rows;
}

async function addJobApplication(userId, role, company, salary, status) {
    await pool.query(
        'INSERT INTO job_applications (user_id, role, company, salary, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, role, company, salary, status]
    );
}

async function deleteJobApplication(applicationId, userId) {
    await pool.query('DELETE FROM job_applications WHERE id = $1 AND user_id = $2', [applicationId, userId]);
}

async function updateTokens(userId, accessToken, refreshToken) {
    await pool.query(
        'UPDATE users SET access_token = $1, refresh_token = $2 WHERE id = $3',
        [accessToken, refreshToken, userId]
    );
}

async function createUser(name, email, hashedPassword) {
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
}

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/users/main-connected');
    } else {
        next();
    }
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/users/login');
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
