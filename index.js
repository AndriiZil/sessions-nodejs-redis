const express = require('express');
const session = require('express-session');
const redis = require('redis');
const connectRedis = require('connect-redis');

const { error } = require('dotenv').config();

if (error) {
    throw new Error(error);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// enable this if you run behind a proxy (e.g. nginx)
app.set('trust proxy', 1);
const RedisStore = connectRedis(session);

//Configure redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379
});

redisClient.on('error', (err) => {
    console.log('Could not establish a connection with redis. ' + err);
});

redisClient.on('connect', (err) => {
    console.log('Connected to redis successfully');
});

//Configure session middleware
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECTET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie
        maxAge: 1000 * 60 * 10 // session max age in milliseconds
    }
}));

app.get('/', (req, res) => {
    let sess = req.session;

    if (sess.username && sess.password) {
        sess = req.session;

        if (sess.username) {
            res.write(`<h1>Welcome ${sess.username} </h1><br>`);
            res.write(`<h3>This is the Home page</h3>`);
            res.end('<a href=' + '/logout' + '>Click here to log out</a >');
        }
    } else {
        res.sendFile(__dirname + '/login.html');
    }
});

app.post('/login', (req, res) => {
    let sess = req.session;

    sess.username = req.body.username
    sess.password = req.body.password
    // add username and password validation logic here if you want. If user is authenticated send the response as success
    res.end('success')
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log(`Server started om port 3000`);
});
