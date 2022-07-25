const mysql = require('mysql2/promise');
const config = require('../config');


class User 
{
    
    async checkLogin(login, password)
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM users WHERE login="${login}" AND password="${password}" LIMIT 1`);
        if(rows.length == 1)
        {
            return rows[0];
        } else 
        {
            return false 
        }
    }
}

module.exports = User;