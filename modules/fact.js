const mysql = require('mysql2/promise');
const config = require('../config');
const Plan = require('./plan')
const plan = new Plan()


class Fact 
{
 


    async uploadFact(items, user)
    {
        const monthDate = plan.translateDateToStandardDate( (await plan.getCurrentMonth()).month_date);
        const connection = await mysql.createConnection(config);
     
        await connection.query(`DELETE FROM fact WHERE date_upload = '${monthDate}'`)
        items.forEach(async item =>  {
            let {ap, fact,hygienePlan, hygieneFact, hygienePercent, commonProvidersSells, askorbinkaBonusFact, commonBonus, lsBad, fito, insurance  } = item
            hygieneFact = +hygieneFact.toFixed(0);
            askorbinkaBonusFact = +askorbinkaBonusFact.toFixed(0);
            
            await connection.query(`
                INSERT INTO fact SET
                pharmacy_id=${ap.id}, 
                fact=${fact}, 
                user='${user}', 
                date_upload='${monthDate}', 
                short_name='${ap.short_name}',
                hygienePlan=${hygienePlan}, 
                hygieneFact=${hygieneFact}, 
                hygienePercent=${hygienePercent}, 
                commonProvidersSells=${commonProvidersSells},
                askorbinkaBonusFact=${askorbinkaBonusFact},
                commonBonus=${commonBonus},
                lsBad=${lsBad},
                fito=${fito},
                insurance=${insurance}


            
            `)
        });
        await connection.end();
       
    }

    async getCurrentFact()
    {
        const monthDate = plan.translateDateToStandardDate( (await plan.getCurrentMonth()).month_date);

        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM fact WHERE date_upload='${monthDate}'`)
        await connection.end();
        return rows
    }
}

module.exports = Fact;