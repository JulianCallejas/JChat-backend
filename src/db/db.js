require("../config/config");

module.exports = {

    connectionLimit: process.env.CONNECTIONLIMIT,
    host: process.env.HOST,
    port: process.env.BDPORT,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE

}