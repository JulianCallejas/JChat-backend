const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();

const {
    getByEmail,
  /*getAll,*/ updateUser,
    updateUserPassword,
    createUser /*, deleteUser*/,
    verifyGoogleToken,
} = require("../model/userRepository");

const rateLimit = require("express-rate-limit");
const { password } = require("../db/db");

// Create the limiter for username and IP pair
const usernameIpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many requests, Try again later",
    keyGenerator: function (req) {
        return req.body.email + req.ip;
    },
    skipSuccessfulRequests: true,
});

// Create the limiter for IP
const ipLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 50, // limit each IP to 50 requests per windowMs
    message: "Too many requests",
});

//Login
router.route("/login").post(usernameIpLimiter, ipLimiter, (req, res, next) => {
    //Verifica si hay errores con el servidor
    try {
        let body = req.body;
        getByEmail(body.email, res, (result) => {
            //Verifica que exista un usuario con el email escrito por el usuario final
            if (!result[0]) {
                return res.status(401).json({
                    ok: false,
                    error: {
                        msg: "Invalid User / Password",
                    },
                });
            }
            if (result[0].activo === 0) {
                return res.status(401).json({
                    ok: false,
                    error: {
                        msg: "Invalid User / Password",
                    },
                });
            }
            //Valida que la contraseña escrita por el usuario, sea la almacenada en la BD
            bcrypt.compare(body.password, result[0].password, function (err, bcryptresult) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        error: err,
                    });
                }
                if (bcryptresult == false) {
                    return res.status(401).json({
                        ok: false,
                        error: {
                            msg: "Invalid User / Password",
                        },
                    });
                }

                //Genera el token de autenticación
                let token = jwt.sign(
                    { user: result[0].email },
                    process.env.SEED_AUTENTICACION,
                    { expiresIn: process.env.CADUCIDAD_TOKEN }
                );

                res.status(200).json({
                    ok: true,
                    email: result[0].email,
                    username: result[0].username,
                    userState: result[0].userState,
                    avatar: result[0].avatar,
                    token,
                });
            });
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
});

/*
router.route("/user/getUsers").get((req, res, next) => {
    try {
        var userToken = req.headers.authorization
        if (!userToken) {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "No tiene autorización para esta consulta",
                },
            });
        }
        userToken = userToken.split(" ")[1];
        var loggedUser = jwt.verify(userToken, process.env.SEED_AUTENTICACION);
        if (loggedUser.type !== "admin") {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "No tiene autorización para esta consulta",
                },
            });
        }
        getAll(res, result => {
            res.status(200).json(result);
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
        
});
*/

//Get My User
router.route("/user").get((req, res, next) => {
    try {
        var userToken = req.headers.authorization;
        if (!userToken) {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "Unauthorized",
                },
            });
        }
        userToken = userToken.split(" ")[1];
        var loggedUser = jwt.verify(userToken, process.env.SEED_AUTENTICACION);
        getByEmail(loggedUser.user, res, (result) => {
            res.status(200).json({
                email: result[0].email,
                username: result[0].username,
                userState: result[0].userState,
                avatar: result[0].avatar,
                active: result[0].active,
            });
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
});

//Update User
router.route("/user").patch((req, res, next) => {
    try {
        var userToken = req.headers.authorization;
        if (!userToken) {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "Unauthorized",
                },
            });
        }
        userToken = userToken.split(" ")[1];
        var loggedUser = jwt.verify(userToken, process.env.SEED_AUTENTICACION);
        let body = req.body;
        if (loggedUser.user !== body.email) {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "Unauthorized",
                },
            });
        }
        if (!body.password) {
            updateUser(body, res, (result) => {
                res.status(200).json(result);
            });
        } else {
            bcrypt.hash(body.password, 10, function (err, hash) {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        error: err,
                    });
                }
                body.password = hash;
                updateUserPassword(body, res, (result) => {
                    res.status(200).json(result);
                });
            });
        }
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
});

//Create User
router.route("/user").post(usernameIpLimiter, ipLimiter, (req, res, next) => {
    try {
        let body = req.body;
        getByEmail(body.email, res, (result) => {
            //Verifica que exista un usuario con el email escrito por el usuario final
            if (!result[0]) {
                bcrypt.hash(body.password, 10, function (err, hash) {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            error: err,
                        });
                    }
                    body.password = hash;
                    createUser(body, res, (result) => {
                        res.status(200).json(result);
                    });
                });
            } else {
                return res.status(401).json({
                    ok: false,
                    error: {
                        msg: "User already exists",
                    },
                });
            }
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
});

/*
router.route("/user/delete").delete((req, res, next) => {
    try {
        var userToken = req.headers.authorization;
        if (!userToken) {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "No tiene autorización para esta consulta",
                },
            });
        }
        userToken = userToken.split(" ")[1];
        var loggedUser = jwt.verify(userToken, process.env.SEED_AUTENTICACION);
        if (loggedUser.type !== "admin") {
            return res.status(401).json({
                ok: false,
                error: {
                    msg: "No tiene autorización para esta consulta",
                },
            });
        }
        let body = req.body;
        deleteUser(body, res, (result) => {
            res.status(200).json(result);
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err,
        });
    }
});
*/

//Google Sign
router.route("/login/google").post(usernameIpLimiter, ipLimiter, async (req, res, next) => {
    //Verifica si hay errores con el servidor
    try {
        let body = req.body || "";
        if (!body.token) {
            throw "Invalid token";
        }
        let data = await verifyGoogleToken(body.token, res);
        console.log(data);
        body.email = data.email;
        body.username = data.given_name
        body.password = "GoogleAuthenticationToken";
        let userData = [{}];
        await getByEmail(body.email, res,  (result) => {
            userData = result;
            //Verifica que exista un usuario con el email escrito por el usuario final
            if (!result[0]) {
                 createUser(body, res, (result) => {
                    userData = [{
                        email: body.email,
                        username: body.username,
                        userState: "Available",
                        avatar: "../../../assets/imgs/avatar/guest.png",
                        active: 1
                    }]
                    let token = jwt.sign(
                        { user: body.email },
                        process.env.SEED_AUTENTICACION,
                        { expiresIn: process.env.CADUCIDAD_TOKEN }
                    );
                    res.status(200).json({
                        ok: true,
                        email: userData[0].email,
                        username: userData[0].username,
                        userState: userData[0].userState,
                        avatar: userData[0].avatar,
                        token,
                    });
                });
            }else{
                let token = jwt.sign(
                    { user: body.email },
                    process.env.SEED_AUTENTICACION,
                    { expiresIn: process.env.CADUCIDAD_TOKEN }
                );
                res.status(200).json({
                    ok: true,
                    email: userData[0].email,
                    username: userData[0].username,
                    userState: userData[0].userState,
                    avatar: userData[0].avatar,
                    token,
                });
            }
        });
      
    } catch (err) {
    return res.status(500).json({
        ok: false,
        error: err,
    });
}
});


module.exports = router;
