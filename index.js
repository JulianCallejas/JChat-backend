require("./src/config/config");
const express = require("express");
const app = express();
var server = require("http").Server(app);
io = require("socket.io")(server, { cors: { origin: "*" } });
const cors = require("cors");
const bodyParser = require("body-parser");
const backRoutes = require("./src/routes/routes");

app.set("port", process.env.PORT);
app.set("port1", process.env.PORT + 1);

//parse application/json
app.use(bodyParser.json());

//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

//Respuesta a Navegador
app.get("/", (req, res) => {
    res.json({
        Title: "Error 400 Unauthorized",
    });
});

//Enables cors
app.use(cors());

app.use("/JChat/", backRoutes);

//SOCKET SERVER CONFIG
function generateRandomString() {
    let rand = "";
    for (let i = 0; i < 5; i++) {
        switch (Math.ceil(Math.random() * 3)) {
            case 1:
                rand += String.fromCharCode(Math.ceil(Math.random() * 26) + 64);
                break;
            case 2:
                rand += String.fromCharCode(Math.ceil(Math.random() * 26) + 96);
                break;
            default:
                rand += Math.ceil(Math.random() * 9);
                break;
        }
    }
    return rand;
}

function startSocketListening() {
    let userList = [];
    let connectionList = {};
    let usersperRoom = {};
    let roomsperUser = {};

    io.use((socket, next) => {
        const sessionID = socket.handshake.auth.sessionID;
        const userID = socket.handshake.auth.userID;
        const room = socket.handshake.auth.room;
        if (sessionID && userID) {
            socket.sessionID = sessionID;
            socket.userID = userID;
            socket.roomName = room;
            return next();
        }
        // const username = socket.handshake.auth.username;
        // if (!username) {
        //   return next(new Error("invalid username"));
        // }
        // create new session
        socket.sessionID = generateRandomString();
        socket.userID = generateRandomString();
        socket.auth = {
            sessionID: socket.sessionID,
            userID: socket.userID
        };
        socket.roomName = 'unknown';
        next();
    });


    io.on("connection", function (socket, connection) {
        console.log("Conexion entrante");

        socket.join(socket.roomName);
        if (usersperRoom[socket.roomName]) {
            usersperRoom[socket.roomName].add(socket.userID);
        } else {
            usersperRoom[socket.roomName] = new Set();
            usersperRoom[socket.roomName].add(socket.userID);
        }
        if (roomsperUser[socket.userID]) {
            roomsperUser[socket.userID].add(socket.roomName);
        } else {
            roomsperUser[socket.userID] = new Set();
            roomsperUser[socket.userID].add(socket.roomName);
        }

        console.log(socket.handshake.address, socket.id, socket.user);

        socket.on('userData', function (userData) {
            let privateMessageUserRoom = "pumr-" + socket.userID;
            socket.join(privateMessageUserRoom);
            socket.id = socket.userID;
            userData.id = socket.userID;
            userData.ip = socket.handshake.address;
            userData.sessionID = socket.sessionID
            connectionList[userData.sessionID] = {
                id: userData.id,
                ip: userData.ip,
                username: userData.username,
                userState: userData.userState,
                avatar: userData.avatar
            }
            console.log(connectionList);

            userList = setUserList(connectionList);

            let roomList = Object.keys(usersperRoom);
            let newUserList = {};
            roomList.map((room) => {
                newUserList[room] = userList.filter(user => usersperRoom[room].has(user[0]));
            });

            // for (let userRoom of roomsperUser[socket.userID]) {
            //     newUserList[userRoom] = userList.filter(user=>usersperRoom[userRoom].has(user[0]));
            // }
            console.log("ul1", newUserList)
            io.emit('userList', newUserList);
        });

        socket.emit('myConnectionId', socket.id);
        socket.emit('userList', userList)

        socket.on('addMessage', function (data) {
            console.log("recived message", data);
            io.to(data[2]).emit('messages', data);
        });

        socket.on('addPrivMessage', function (data) {
            console.log("recived priv message:", data);
            let room = ["pumr-" + data[4], "pumr-" + data[0]];
            io.to(room).emit('messages', data);
        });

        socket.on('disconnect', function () {
            console.log("Disconnected data:", socket.userID, socket.roomName);
            try {
                usersperRoom[socket.roomName].delete(socket.userID);
                roomsperUser[socket.userID].delete(socket.roomName);
                if (roomsperUser[socket.userID].length < 1) {
                    delete connectionList[socket.sessionID];
                }
                if (usersperRoom[socket.roomName].size === 0) {
                    delete usersperRoom[socket.roomName];
                }

            } catch (error) {
                console.log(error);
            }
            userList = setUserList(connectionList);
            let roomList = Object.keys(usersperRoom);
            let newUserList = {};
            roomList.map((room) => {
                newUserList[room] = userList.filter(user => usersperRoom[room].has(user[0]));
            });
            console.log(newUserList);
            io.emit('userList', newUserList);
        });

    });
}

function setUserList(connectionList) {
    let clkeys = Object.keys(connectionList);
    let userList = [];
    if (clkeys.length > 0) {
        clkeys.map(userkey => {
            userList.push([
                connectionList[userkey].id,
                connectionList[userkey].username,
                connectionList[userkey].userState,
                connectionList[userkey].avatar]);
        })
    }
    return userList;
}

startSocketListening();

//iniciando Servidor
server.listen(4000, () => {
    console.log("Server escuchando por el puerto : " + 4000);
});

app.use(function (err, req, res, next) {
    console.error(err.message);
    if (!err.statusCode) err.statusCode = 500;
    res.status(err.statusCode).send(err.message);
});

