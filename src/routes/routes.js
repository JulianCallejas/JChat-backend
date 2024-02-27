const express = require("express");
const app = express();

app.use(require("./routesUsuarios"));

//app.use(require("./routesCreditos"));
//app.use(require("./routesPropuestas"));

module.exports = app;