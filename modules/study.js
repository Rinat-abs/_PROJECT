const 
    mysql = require('mysql2/promise'),
    config = require('../config');
    fs = require('fs')
const 
    Plan = require('./plan'),
    plan = new Plan();

class Study 
{
    async getCategories()
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query('SELECT * FROM current_month');
        return rows;
    }

    

    
}

module.exports = Study