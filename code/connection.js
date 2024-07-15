const {Client} = require('pg')

const client = new Client({
    host: "localhost",
    port : 5432,
    user: "postgres",
    password: "KING.d@1382",
    database: "school"
})

module.exports = client