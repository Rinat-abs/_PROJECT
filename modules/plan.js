
const mysql = require('mysql2/promise');
const config = require('../config');


class Plan 
{
    getZero(num)
    {
        if(num<10)
        {
            return '0'+num
        } else  
        return num
    }

    replaceCommasWithDots(str)
    {
        str = str.replace(/\s+/g, '');
        str = str.replace(/,/g, '.');
        return str
    }

    translateDateToStandardDate(date)
    {
        return `${this.getZero(date.getFullYear())}.${this.getZero(date.getMonth()+1)}.${this.getZero(date.getDate())}`;
    }

    async getCurrentMonth()
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM current_month WHERE status=1 LIMIT 1`);
        await connection.end();
        return rows[0];
    }

    async getApIdByText(pharmacy)
    {
 
           
            
            pharmacy = pharmacy.substr(pharmacy.indexOf('№'), 4);
            pharmacy = pharmacy.replace(/\s+/g, '');
            pharmacy = pharmacy.replace("\"", '');
            pharmacy = pharmacy.replace("\'", '');
            pharmacy = pharmacy.replace(/[a-zа-яё]/gi, '');
            pharmacy = 'Аптека ' + pharmacy;
            // console.log(pharmacy)
            const connection = await mysql.createConnection(config);
      
            const [rows] = await connection.query(`SELECT * FROM pharmacies WHERE short_name='${pharmacy}' LIMIT 1`);
            await connection.end();
            return rows[0];
        
        

    }


    async uploadPlan(items, user)
    {
        const monthDate = this.translateDateToStandardDate( (await this.getCurrentMonth()).month_date);
        
        const connection = await mysql.createConnection(config);

        await connection.query(`DELETE FROM plan WHERE date_upload = '${monthDate}'`)
        items.forEach(async item =>  {
            await connection.query(`INSERT INTO plan SET pharmacy_id=${item.ap.id}, plan=${item.plan}, user='${user}', date_upload='${monthDate}', short_name='${item.ap.short_name}'`)
        });
        await connection.end();
       
    }

    async getCurrentPlan()
    {
        const monthDate = this.translateDateToStandardDate( (await this.getCurrentMonth()).month_date);

        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM plan WHERE date_upload='${monthDate}'`)
        await connection.end();
        return rows
    }

    async getPharmacies()
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM pharmacies`)
        await connection.end();
        return rows
   
    }

    async getPharmacyByNum(num)
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM pharmacies WHERE num=${num}`)
        await connection.end();
        if(rows.length == 0)
        {
            return false
        }
        return rows[0]
        
    }

    async getPharmacyCategories()
    {
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM pharmacy_categories`)
        await connection.end();
        return rows
    } 
    async addPharmacy(full_name, num)
    {
        // full_name = full_name.replace(/\s+/g, '')
        const connection = await mysql.createConnection(config);
        await connection.query(`INSERT INTO pharmacies SET full_name='${full_name}', short_name="Аптека №${num}", num='${num}', date_start='${(new Date().getFullYear())}-${(new Date().getMonth()) + 1}-${(new Date().getDate())}', percent_done="0", month="0", current_month=${(await this.getCurrentMonth()).id}`)
        await connection.end();
        
        
    }

    async editPlan(id, plan)
    {
        const monthDate = this.translateDateToStandardDate( (await this.getCurrentMonth()).month_date);
        const connection = await mysql.createConnection(config);
        const [rows] = await connection.query(`SELECT * FROM plan WHERE id=${id} AND  date_upload = '${monthDate}' LIMIT 1`)
        if(rows.length == 1)
        {
            await connection.query(`UPDATE plan SET plan = ${plan} WHERE id = ${id}`);
        }
       
        await connection.end();

    }

    async editPharmacyCategories(id, money)
    {
        const connection = await mysql.createConnection(config);
        await connection.query(`UPDATE pharmacy_categories SET money = ${money} WHERE id = ${id}`);
        await connection.end();

    }


    async editPharmacyCategoriesRevenue(id, revenue)
    {
        const connection = await mysql.createConnection(config);
        await connection.query(`UPDATE pharmacy_categories SET revenue = ${revenue} WHERE id = ${id}`);
        await connection.end();

    }

    async editPharmacyCategoriesHygiene(id, hygiene)
    {
        const connection = await mysql.createConnection(config);
        await connection.query(`UPDATE pharmacy_categories SET money_hygiene = ${hygiene} WHERE id = ${id}`)
        await connection.end();

    }
}

module.exports = Plan;