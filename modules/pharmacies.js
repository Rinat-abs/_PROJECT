const 
    mysql = require('mysql2/promise'),
    config = require('../config');
    fs = require('fs'),
    Plan = require('./plan'),
    plan = new Plan();

class Pharmacies 
{
    getDataFromJSONFile()
    {
        return JSON.parse(fs.readFileSync((`\\\\192.168.0.25\\BonusPharma\\JSONFiles\\StaffBonus.json`), "utf8"));
    }

    async getMaxWorkDay()
    {
        const connection = await mysql.createConnection(config)
        const [rows] = await connection.query('SELECT MAX(workDay) AS maxWorkDay FROM pharmacy_staff WHERE deleteUser="no"');
        await connection.end()
        return rows[0].maxWorkDay
    }

    async getPharmacyByIINWithoutMoving(iin)
    {
        const connection = await mysql.createConnection(config)
        const [rows] = await connection.query(`SELECT * FROM pharmacy_staff WHERE iin = ${iin} AND moving='Нет' LIMIT 1`);
        await connection.end()
        if(rows[0]) return rows[0];
        return false
    }

    async getPharmacyByIINWithMoving(iin)
    {
        const connection = await mysql.createConnection(config)
        const [rows] = await connection.query(`SELECT * FROM pharmacy_staff WHERE iin = ${iin} AND moving='Да' LIMIT 1`);
        await connection.end()
        if(rows[0]) return rows[0];
        return false
    }

    async getPharmacyByIIN(iin)
    {
        const connection = await mysql.createConnection(config)
        const [rows] = await connection.query(`SELECT * FROM pharmacy_staff WHERE iin = ${iin} LIMIT 1`);
        await connection.end()
        if(rows[0]) return rows[0];
        return false
    }

    async addPharmaciestStudy(pharmaciest)
    {
        const connection = await mysql.createConnection(config)
        const [rows] = await connection.query(`SELECT * FROM study WHERE user_iin = ${pharmaciest.iin} AND current_month_id	 = '${pharmaciest.current_month_id}'`);
        // console.log(pharmaciest)
        if(!rows[0])
        {
            await connection.query(`
                INSERT INTO study SET
                user_iin = '${pharmaciest.iin}', 
                pharmacy_id = '${pharmaciest.pharmacy_id}', 
                done = '0',
                current_month_id = '${pharmaciest.current_month_id}'

            `)
        }

        await connection.end()
      
    }

    async uploadPharmaciesStaff()
    {

        let pharamaciesStaff =  this.getDataFromJSONFile()
        const connection = await mysql.createConnection(config)
        const current_month = await plan.getCurrentMonth()
        await connection.query(`
                UPDATE pharmacy_staff SET
                deleteUser='yes'
        `);

        await connection.query(`
            DELETE FROM pharmacy_staff 
            WHERE
            moving='Да'
        `);
        for(let j = 0; j < pharamaciesStaff.length; j++)
        {
           
            let  pharmacy = await plan.getApIdByText(pharamaciesStaff[j]['АптекаНаименование']);
                    
            await connection.query(`
                UPDATE pharmacies SET
                staff='${pharamaciesStaff[j]["ОбщееКоличество"]}',
                pharmacist='${pharamaciesStaff[j]["Фармацевты"]}', 
                specialist='${pharamaciesStaff[j]["Специалисты"] || 0}' 
                WHERE id=${pharmacy.id}
            `);

            
            
           
            for(let i = 0; i < pharamaciesStaff[j]['Сотрудники'].length; i++)
            {   
                
                const 
                    name = pharamaciesStaff[j]['Сотрудники'][i]['Сотрудник'],
                    iin =pharamaciesStaff[j]['Сотрудники'][i]['ИИН'],
                    position=pharamaciesStaff[j]['Сотрудники'][i]['Должность'],
                    newEmployee = pharamaciesStaff[j]['Сотрудники'][i]['НовыйСотрудник'],
                    experience=pharamaciesStaff[j]['Сотрудники'][i]['ОпытСотрудника'],
                    bonusInsurance=pharamaciesStaff[j]['Сотрудники'][i]['БонусСтраховка'],
                    moving=pharamaciesStaff[j]['Сотрудники'][i]['Перемещение'],
                    workDay=pharamaciesStaff[j]['Сотрудники'][i]['ФактОтрабДни'],
                    leaveJob = pharamaciesStaff[j]['Сотрудники'][i]['Увольнение'],
                    retention = pharamaciesStaff[j]['Сотрудники'][i]['Удержание'];
               
                if(pharamaciesStaff[j]['Сотрудники'][i]['Перемещение'] === 'Нет')
                {
                     
                    pharmacy = await plan.getApIdByText(pharamaciesStaff[j]['АптекаНаименование'])
                    const pharmacy_id = pharmacy.id;
                    const pharmacyStaffPerson = await this.getPharmacyByIINWithoutMoving(pharamaciesStaff[j]['Сотрудники'][i]['ИИН'])
                    
                    if(!pharmacyStaffPerson)
                    {
                       
                        await connection.query(`
                            INSERT INTO pharmacy_staff SET 
                            name='${name}',
                            iin='${iin}',
                            pharmacy_id='${pharmacy_id}',  
                            position='${position}',
                            new='${newEmployee}',
                            experience='${experience}',
                            bonusInsurance='${bonusInsurance}', 
                            moving='${moving}',
                            workDay='${workDay}',
                            leaveJob='${leaveJob}',
                            retention='${retention}',
                            current_month_id='${current_month.id}',
                            deleteUser='no'
                            
                        `);

                        const pharmaciest = await this.getPharmacyByIIN(iin);
                        await this.addPharmaciestStudy(pharmaciest)





                    } else 
                    {    
                        await connection.query(`
                            UPDATE pharmacy_staff SET            
                                pharmacy_id='${pharmacy_id}',  
                                position='${position}',
                                new='${newEmployee}',
                                experience='${experience}',
                                bonusInsurance='${bonusInsurance}',
                                moving='${moving}',
                                workDay='${workDay}',
                                leaveJob='${leaveJob}',
                                retention='${retention}',
                                current_month_id='${current_month.id}',
                                deleteUser='no'
                            WHERE id=${pharmacyStaffPerson.id} 
                        `);

                        const pharmaciest = await this.getPharmacyByIIN(iin);
                        await this.addPharmaciestStudy(pharmaciest)
                    }
                }
                else 
                {
                     
                        pharmacy = await plan.getApIdByText(pharamaciesStaff[j]['АптекаНаименование']);
                        const pharmacy_id = pharmacy.id;
                    await connection.query(`
                        INSERT INTO pharmacy_staff SET 
                        name='${name}',
                        iin='${iin}',
                        pharmacy_id='${pharmacy_id}',  
                        position='${position}',
                        new='${newEmployee}',
                        experience='${experience}',
                        bonusInsurance='${bonusInsurance}',
                        moving='${moving}',
                        workDay='${workDay}',
                        leaveJob='${leaveJob}',
                        retention='${retention}',
                        current_month_id='${current_month.id}',
                        deleteUser='no'
                    `);

                        const pharmaciest = await this.getPharmacyByIIN(iin);
                        await this.addPharmaciestStudy(pharmaciest)
                    
                }
            }
        }



        await connection.end()
    }
}

module.exports = Pharmacies 