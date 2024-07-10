const express = require('express');
const app = express();
const { pool } = require('./dbConfig.js');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const path = require('node:path');
const methodOverride = require('method-override');


const initializePassport = require("./passportCOnfig.js");
const { METHODS } = require('node:http');

initializePassport(passport);


const PORT = process.env.PORT || 4000;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));

app.use(session({
    secret: 'secret',

    resave: false,

    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/users/register', checkAuthenticated, (req, res)=>{
    res.render('register.ejs');
});

app.get('/users/login', checkAuthenticated, (req, res)=>{
    res.render('login.ejs');
});

app.get('/users/main-connected', checkNotAuthenticated, async (req, res) => {
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



app.get("/users/logout", (req, res) => {
        req.logout(err => {
            if (err) {
                return next(err);
            };
        res.redirect('http://localhost:4000/users/login')
        });
});



app.post('/users/register', async (req, res)=>{
    let {name, email, password, password2} = req.body;
    console.log({
        name, 
        email, 
        password, 
        password2
    });

    let errors = [];

    if (!name || !email || !password || !password2){
        errors.push({message : "Please enter all fields"});
    }

    if(password.length < 6){
        errors.push({message : "Password should be at least 6 characters"});
    }

    if(password != password2){
        errors.push({message : "Passwords do not match"});
    }

    if(errors.length > 0){
        res.render('register', {errors});
    } else {
        let hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        pool.query(
            `SELECT * FROM users
              WHERE email = $1`,
            [email],
            (err, results) => {
              if (err) {
                console.log(err);
              }
              console.log(results.rows);
      
              if(results.rows.length>0){
                errors.push({message: "Email already registered"});
                res.render('register', { errors });
              }else{
                pool.query(
                    `INSERT INTO users (name, email, password)
                    VALUES ($1, $2, $3)
                    RETURNING id, password`, [name, email, hashedPassword],
                    (err, results) => {
                        if (err){
                            throw err;
                        }
                        console.log(results.rows);
                        req.flash('success_msg', "You are now registered. Please log in");
                        res.redirect('/users/login');
                    }

                )
              }
            }
        );
    }
});



app.post('/users/main-connected',checkNotAuthenticated, (req, res)=>{
    let{role, company, salary} = req.body;
    let status = 'Not Answered';
    console.log({
        role,
        company,
        salary,
        status
    });

    let errors= [];

    if (!role || !company || !salary){
        errors.push({message: "Please enter all fields (You can put '?' if you don't know the salary)"})
    }

    if(errors.length > 0){
        pool.query(
            `SELECT * FROM job_applications WHERE user_id = $1`,
            [req.user.id],
            (err, results) => {
                if (err) {
                    console.log(err);
                    return res.send('Error fetching the job applications')
                }
                res.render('main-connected', { errors, user: req.user.name, jobApplications: results.rows });
            }
        );
    }else{
        pool.query(
            `INSERT INTO job_applications (user_id, role, company, salary, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING role, company, salary, status`, [req.user.id, role, company, salary, status],
            (err, results) => {
                if (err){
                    console.log(err);
                    return res.send('Error adding job application');
                }
                console.log(results.rows);
                pool.query(
                    `SELECT * FROM job_applications WHERE user_id = $1`, [req.user.id],
                    (err, results) => {
                        if (err){
                            console.log(err);
                            return res.send('Error fetching the job applications');
                        }
                        res.render('main-connected', {user: req.user.name, jobApplications: results.rows, errors: []});
                    }
                );
            }
        );
        
    }
    
    
});

app.delete('/users/main-connected/:id', checkNotAuthenticated, (req, res)=>{
    const { id } = req.params;
    pool.query(
        `DELETE FROM job_applications WHERE id = $1 AND user_id = $2`,
        [id, req.user.id],
        (err, results) => {
            if (err) {
                console.log(err);
                return res.send('Error deleting job application');
            }
            res.redirect('/users/main-connected');
        }
    );
});

app.post(
    '/users/login', 
    passport.authenticate('local', {
        successRedirect: "/users/main-connected",
        failureRedirect: "/users/login",
        failureFlash: true,
}));

app.post('/users/main-connected/add', checkNotAuthenticated, async (req, res) => {
    const { company_name, job_title, application_date, status } = req.body;
    try {
        await pool.query(
            `INSERT INTO job_applications (user_id, role, company, salary, status)
            VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, company_name, job_title, application_date, status]
        );
        res.redirect('/users/dashboard');
    } catch (err) {
        console.error(err);
        res.send("Error adding job application");
    }
});

function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
        return res.redirect('/users/main-connected');
    }else{
        next();
    }
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/users/login');
}

app.listen(PORT, '127.0.0.1',  ()=>{
    console.log(`Server running on port ${PORT}`);
});