const mysql = require('mysql');
const db = require("../db/db");
var pool = mysql.createPool(db);

const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLEIDCLIENTE;
const client = new OAuth2Client(CLIENT_ID);

async function getByEmail(email, res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'SELECT * FROM users WHERE email = ' + connection.escape(email) + ';';
        connection.query(sql, function (error, results, fields) {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}

/*
async function getAll(res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'SELECT email, username, userState, creatingDate, active FROM users ORDER BY creatingDate;';
        connection.query(sql, function (error, results, fields) {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}
*/

async function updateUserPassword(body, res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'UPDATE users SET password = ' + connection.escape(body.password) +
            ', username = ' + connection.escape(body.username) +
            ', userState = ' + connection.escape(body.userState) +
            ', avatar = ' + connection.escape(body.avatar) +
            ', active = ' + connection.escape(body.active) +
            ' WHERE(email = ' + connection.escape(body.email) + '); ';
        connection.query(sql, function (error, results, fields) {
            if (error) {
                console.log(error)
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}

async function updateUser(body, res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'UPDATE users SET username = ' + connection.escape(body.username) +
            ', userState = ' + connection.escape(body.userState) +
            ', avatar = ' + connection.escape(body.avatar) +
            ', active = ' + connection.escape(body.active) +
            ' WHERE(email = ' + connection.escape(body.email) + '); ';
        connection.query(sql, function (error, results, fields) {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}

async function createUser(body, res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'INSERT INTO users (email, username, password) VALUES (?, ?, ? )';
        var values = [(body.email), (body.username), (body.password)];
        connection.query(sql, values, function (error, results, fields) {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}


/*
async function deleteUser(body, res, callback) {
    await pool.getConnection(function (err, connection) {
        if (err) throw err; // not connected!
        var sql = 'DELETE FROM users WHERE (email = ' + connection.escape(body.email) + ');';
        connection.query(sql, function (error, results, fields) {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    error: error,
                });
            }
            callback(results);
        });
        connection.release();
    });
}
*/

//verify google token
async function verifyGoogleToken(token, res) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
            // Or, if multiple clients access the backend:
            //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        console.log(payload);
        return payload;
        // If request specified a G Suite domain:
        // const domain = payload['hd'];

    } catch (err) {
        throw "Invalid token";
    }
    
  }


module.exports = {
    getByEmail,
    //getAll,
    updateUser,
    updateUserPassword,
    createUser,
    //deleteUser
    verifyGoogleToken,
};
