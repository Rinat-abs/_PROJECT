const mysql = require('mysql2/promise');
const config = require('../config');
const Plan = require('./plan');
const PharmaciesModule = require('./pharmacies');
const plan = new Plan()
const pharmaciesModule = new PharmaciesModule()
const config_PH_TEST = require('../config_PH_TEST');

class Bonus {
    
    compareDates(date1, date2)
    {

        let timeDiff = Math.abs(date2.getTime() - date1.getTime());
        let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
        return diffDays;
    }

    async getExceptionKoefPharmacy()
    {
        const connection = await mysql.createConnection(config)
        let [rows] = await connection.query(`SELECT * FROM koef_askorbinka_bonus`)
        await connection.end();
        return rows
    }

    async createBonusPartOne()
    {
        const _fileNamePartOneBonus = 'part_1_bonus.xlsx'
        const Excel = require('exceljs');
       
        let workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(`files/templates/${_fileNamePartOneBonus}`);
        let worksheet =  workbook.worksheets[0];
     

        const {month_date, id} = await plan.getCurrentMonth();
        const connection = await mysql.createConnection(config);
        await connection.query(`DELETE FROM bonuses_part_one WHERE currentDate="${plan.translateDateToStandardDate(month_date)}"`)
        const exceptionKoefPharmacies = await this.getExceptionKoefPharmacy();
        

        let [rows] = await connection.query(`
            SELECT 
                plan.plan AS plan,
                fact.fact AS fact,
                fact.hygienePlan AS hygienePlan,
                fact.askorbinkaBonusFact AS askorbinkaBonusFact,
                (fact.askorbinkaBonusFact*100)/plan.plan AS koefAskorbinkaBonus,
                fact.hygieneFact AS hygieneFact,
                fact.hygienePercent AS hygienePercent,
                fact.commonProvidersSells AS commonProvidersSells,
                fact.commonBonus AS commonBonus,
                fact.lsBad AS lsBad,
                fact.fito AS fito,
                fact.insurance AS insurance,
                plan.pharmacy_id AS pharmacyId,
                (fact.fact*100)/plan.plan AS percentDone,
                pharmacies.id AS pharmacyId,
                pharmacies.short_name AS pharmacy,
                pharmacies.date_start AS pharmacyDateStart,
                pharmacies.full_name AS pharmacyFullName, 
                pharmacies.percent_done AS pharmacyOverPercentDone,
                pharmacies.month AS pharmacyMonth,
                pharmacies.current_month AS pharmacyCurrentMonth,
                pharmacies.staff AS pharmacyStaffCount,
                pharmacies.pharmacist AS pharmacistCount,
                pharmacies.specialist AS pharmacistSpecialistCount,
                plan.date_upload AS currentDate
            FROM fact
                INNER JOIN plan ON plan.pharmacy_id = fact.pharmacy_id
                INNER JOIN pharmacies ON plan.pharmacy_id = pharmacies.id
            WHERE plan.date_upload = "${plan.translateDateToStandardDate(month_date) }" AND fact.date_upload = "${plan.translateDateToStandardDate(month_date)}"
        `)
        
        
        for(let i = 0; i < rows.length; i++)
        {
            
            
            
            let koef = ''
            if(+rows[i].koefAskorbinkaBonus)
            {
                koef = +rows[i].koefAskorbinkaBonus.toFixed(1)
            } else 
            {
                koef = 0
            }
        
            if(this.compareDates(rows[i].pharmacyDateStart, month_date) < 30)
            {
                rows[i].askorbinkaBonus = 0
            } else 
            {
                if(koef >= 1.8)
                {
                    rows[i].askorbinkaBonus = 10000
                } else 
                {
                    // exceptionKoefPharmacies.forEach((item) => {
                    //     if(item.pharmacy_id == rows[i].pharmacyId)
                    //     {   
                            
                    //         if(koef >= item.koef  )
                    //         {
                                
                    //             rows[i].askorbinkaBonus = 10000;
                                
                    //         } 
                    //         else {
                            
                    //             rows[i].askorbinkaBonus = -10000;
                                
                    //         }
                    //     }
                    // })

                    for(let j = 0; j < exceptionKoefPharmacies.length; j++)
                    {
                        if(exceptionKoefPharmacies[j].pharmacy_id == rows[i].pharmacyId)
                        {   
                            
                            if(koef >= exceptionKoefPharmacies[j].koef  )
                            {
                                
                                rows[i].askorbinkaBonus = 10000;
                                break
                            } 
                            else {
                            
                                rows[i].askorbinkaBonus = -10000;
                                break
                                
                            }
                        }
                    }

                    if(rows[i].askorbinkaBonus != 10000 && rows[i].askorbinkaBonus != -10000)
                    {
                        rows[i].askorbinkaBonus = -10000
                    }

                }
            }

            
            

            
            if(rows[i].pharmacyFullName.includes('Уральск'))
            {

                if( this.compareDates(rows[i].pharmacyDateStart, month_date) <= 60)
                {
                    
                    const category = await this.getCategoryApById(7)
                    rows[i].category = category.category
                    rows[i].bonus = 0  
                    rows[i].overfulfillment = 0
                    rows[i].hygieneOverfullfilment =  0
                        
            
                    
                }
                else 
                {
                    const category = await this.getCategoryApByPlan(rows[i].fact)
                
                rows[i].category = category.category
                rows[i].bonus = 0
                if(rows[i].hygienePercent >=99.5)
                {
                    rows[i].hygieneOverfullfilment =  0
                } else 
                {
                    rows[i].hygieneOverfullfilment =  0
                }
                // Если обновляется текущий месяц (категория)
                if(rows[i].pharmacyCurrentMonth == id)
                {
          
                    if(rows[i].percentDone>=114.5)
                    {
                     
                       
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth,id );
                    }
                    else  if(rows[i].percentDone>=109.5)
                    {
                        
                  
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth,id);
                    }
                    else 
                    {

                        rows[i].overfulfillment=0;
                        await this.pharmacyEdit(rows[i].pharmacyId,0,0,id );
                    }
                    
                } else  
                {
                    // Обновление старых данных
                    if(rows[i].percentDone>=114.5 && rows[i].pharmacyOverPercentDone == 115)
                    {
                        rows[i].pharmacyMonth = this.checkThreeMonths(rows[i].pharmacyMonth);
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth, id );
                    } 
                    else if(rows[i].percentDone>=114.5)
                    {
                        rows[i].pharmacyMonth = 1;
                        rows[i].pharmacyOverPercentDone = 115
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth, id );
                    }
                    else if (rows[i].percentDone>=109.5 && rows[i].pharmacyOverPercentDone == 110)
                    {
                        rows[i].pharmacyMonth = this.checkThreeMonths(rows[i].pharmacyMonth);
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth, id );
                    } 
                    else if(rows[i].percentDone>=109.5)
                    {
                        rows[i].pharmacyMonth = 1;
                        rows[i].pharmacyOverPercentDone = 110;
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth, id );
                    }
                    else 
                    {
                        rows[i].overfulfillment=0;
                        rows[i].pharmacyOverPercentDone = 0;
                        await this.pharmacyEdit(rows[i].pharmacyId,0,0,id);
                    }
                    
                    
                }
                }
            }
            else if( this.compareDates(rows[i].pharmacyDateStart, month_date) <= 60)
            {   
                
                // аптеки до 2 месяцев
                if(rows[i].pharmacyFullName.includes('Атырау') || rows[i].pharmacyFullName.includes('Шымкент') || rows[i].pharmacyFullName.includes('Тараз'))
                {
                    
                    const category = await this.getCategoryApById(6)
                    
                    rows[i].category = category.category
                    rows[i].bonus = category.money 
                    rows[i].overfulfillment = 0
                    rows[i].hygieneOverfullfilment =  category.money_hygiene
                    
                } else 
                {
                    const category = await this.getCategoryApById(7)

                    rows[i].category = category.category
                    rows[i].bonus = category.money  
                    rows[i].overfulfillment = 0
                    rows[i].hygieneOverfullfilment =  category.money_hygiene
                    
                }
                
            } else 
            {
                const category = await this.getCategoryApByPlan(rows[i].fact)
                rows[i].category = category.category
                rows[i].bonus = rows[i].percentDone >= 99.5 ? category.money : 0
                if(rows[i].hygienePercent >=99.5)
                {
                    rows[i].hygieneOverfullfilment =  category.money_hygiene
                } else 
                {
                    rows[i].hygieneOverfullfilment =  0
                }
                // Если обновляется текущий месяц (категория)
                if(rows[i].pharmacyCurrentMonth == id)
                {
                    
                    if(rows[i].percentDone>=114.5)
                    {
                        // console.log(rows[i])
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth, id );
                    }
                    else  if(rows[i].percentDone>=109.5)
                    {
                       
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth,id );
                    }
                    else 
                    {   
                        rows[i].overfulfillment=0;
                        await this.pharmacyEdit(rows[i].pharmacyId,0,0, id );
                    }
                } else 
                {
                    // Обновление старых данных
                    if(rows[i].percentDone>=114.5 && rows[i].pharmacyOverPercentDone == 115)
                    {
                        rows[i].pharmacyMonth = this.checkThreeMonths(rows[i].pharmacyMonth);
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth, id );
                    } 
                    else if(rows[i].percentDone>=114.5)
                    {
                        rows[i].pharmacyMonth = 1;
                        rows[i].pharmacyOverPercentDone = 115;
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 115)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 115,rows[i].pharmacyMonth, id );
                    }
                    else if (rows[i].percentDone>=109.5 && rows[i].pharmacyOverPercentDone == 110)
                    {
                        rows[i].pharmacyMonth = this.checkThreeMonths(rows[i].pharmacyMonth);
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth, id );
                    } 
                    else if(rows[i].percentDone>=109.5)
                    {
                        rows[i].pharmacyMonth = 1;
                        rows[i].pharmacyOverPercentDone = 110;
                        rows[i].overfulfillment = (await this.getOverfulfillmentMonthMoney(category.id, rows[i].pharmacyMonth, 110)).money
                        await this.pharmacyEdit(rows[i].pharmacyId, 110,rows[i].pharmacyMonth, id );
                    }
                    else 
                    {
                        rows[i].overfulfillment=0;
                        rows[i].pharmacyOverPercentDone = 0;
                        await this.pharmacyEdit(rows[i].pharmacyId,0,0,id);
                    }
                }

               
            }

            
            // ######################## Доп. подсчеты ########################
            rows[i].markDogovorLsBadAndFito = +(rows[i].fito+rows[i].lsBad).toFixed(0)
            if(rows[i].pharmacistSpecialistCount === 0)
            {
            
                rows[i].markDogovor =  ((rows[i].markDogovorLsBadAndFito+rows[i].commonProvidersSells) / rows[i].pharmacistCount) >= 20000 ? (rows[i].markDogovorLsBadAndFito+rows[i].commonProvidersSells).toFixed(2) : 0
                rows[i].fitoFormula = 0
                rows[i].hygieneOverfullfilment = 0
                rows[i].bonusSpecialists=0
            } else 
            {
                rows[i].markDogovor = (rows[i].lsBad/rows[i].pharmacistCount) >= 20000 ? rows[i].lsBad.toFixed(2) : 0
                if(((rows[i].commonProvidersSells +rows[i].fito)/rows[i].pharmacistSpecialistCount) >= 3000 )
                {
                    rows[i].fitoFormula = +(rows[i].commonProvidersSells +rows[i].fito).toFixed(0)

                } else 
                {
                    rows[i].fitoFormula = 0
                }

                rows[i].bonusSpecialists = +(rows[i].hygieneOverfullfilment  + (rows[i].fitoFormula/rows[i].pharmacistSpecialistCount) + (rows[i].overfulfillment/rows[i].pharmacyStaffCount)).toFixed(0)
                if(month_date.getMonth() == 5 || month_date.getMonth() == 6 || month_date.getMonth() == 7)
                {
                    rows[i].bonusSpecialists += rows[i].askorbinkaBonus
                }
            }


            rows[i].bonusPharmaciests = +(rows[i].bonus + rows[i].askorbinkaBonus + (rows[i].markDogovor/rows[i].pharmacistCount) + (rows[i].overfulfillment/rows[i].pharmacyStaffCount)).toFixed(0);


            


            //###############################  Формирование файла EXCEL ###############################
            

            const redBgForCells = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{argb:'F08080'},
            };
            const greenBgForCells = {
                type: 'pattern',
                pattern:'solid',
                fgColor:{argb:'2E8B57'},
            };
            
            rows[i].percentDone = rows[i].percentDone ?  rows[i].percentDone.toFixed(2)  :  rows[i].percentDone;
            rows[i].hygienePercent = rows[i].hygienePercent ?  rows[i].hygienePercent.toFixed(2)  :  rows[i].hygienePercent;
            const {category, pharmacy, planE, fact, percentDone, bonus, overfulfillment, hygienePlan, hygieneFact, hygienePercent, hygieneOverfullfilment, lsBad, askorbinkaBonus, commonProvidersSells, fito, fitoFormula, pharmacyStaffCount, pharmacistCount, pharmacistSpecialistCount, markDogovorLsBadAndFito,markDogovor,bonusPharmaciests, bonusSpecialists} = rows[i];
            const arrForCells = [category, pharmacy, planE, fact, percentDone, bonus, overfulfillment, hygienePlan, hygieneFact, hygienePercent, hygieneOverfullfilment, markDogovorLsBadAndFito, lsBad, markDogovor, askorbinkaBonus, commonProvidersSells, fito,fitoFormula, pharmacyStaffCount,pharmacistCount , pharmacistSpecialistCount, bonusPharmaciests, bonusSpecialists];
            
            for(let j = 0; j < arrForCells.length; j++)
            {
                let cell =  worksheet.getRow(i + 2).getCell(j+1)
                cell.value = arrForCells[j];
                cell.border = {
                    top: {style:'thin'},
                    left: {style:'thin'},
                    bottom: {style:'thin'},
                    right: {style:'thin'}
                };

                if(j === 4 || j === 9)
                    {
                        if(arrForCells[j] >= 99.5)
                    {
                    
                        cell.fill = {...greenBgForCells};
                    } else 
                    {
                    
                        cell.fill = {...redBgForCells};
                    }
                }

                if(j === 21 || j === 22)
                {
                    if(arrForCells[j] <= 0)
                    {
                        cell.fill = {...redBgForCells};
                        
                    } else 
                    {
                        cell.fill = {...greenBgForCells};
                        
                    }
                }
            }




            await connection.query(`
                INSERT INTO bonuses_part_one SET
                    category="${rows[i].category}",
                    pharmacy="${rows[i].pharmacy}",
                    plan="${rows[i].plan}",
                    fact="${rows[i].fact}",
                    percentDone="${rows[i].percentDone}",
                    bonus="${rows[i].bonus}",
                    overfulfillment="${rows[i].overfulfillment}",
                    currentDate="${plan.translateDateToStandardDate(rows[i].currentDate)}",
                    hygienePlan="${rows[i].hygienePlan}",
                    hygieneFact="${rows[i].hygieneFact}",
                    hygienePercent="${rows[i].hygienePercent}",
                    hygieneOverfullfilment="${rows[i].hygieneOverfullfilment}",
                    markDogovorLsBadAndFito="${rows[i].markDogovorLsBadAndFito}",
                    lsBad="${rows[i].lsBad}",
                    markDogovor="${rows[i].markDogovor}",
                    askorbinkaBonus="${rows[i].askorbinkaBonus}",
                    commonProvidersSells="${rows[i].commonProvidersSells}",
                    fito="${rows[i].fito}",
                    fitoFormula="${rows[i].fitoFormula}",
                    pharmacyStaffCount="${rows[i].pharmacyStaffCount}",
                    pharmacistCount="${rows[i].pharmacistCount}",
                    pharmacistSpecialistCount="${rows[i].pharmacistSpecialistCount}",
                    bonusPharmaciests="${rows[i].bonusPharmaciests}",
                    bonusSpecialists="${rows[i].bonusSpecialists}"
                     
            `);

        }

        await connection.end()
        await workbook.xlsx.writeFile(`files/files_ready/${_fileNamePartOneBonus}`);
        
        return (rows)
    }

    async getCategoryApByPlan(plan)
    {
        const connection = await mysql.createConnection(config)
        let [rows] = await connection.query(`
            SELECT * FROM pharmacy_categories
            WHERE
            revenue BETWEEN ${plan} AND 1000000000  
            ORDER BY revenue ASC LIMIT 1 
        `)
        await connection.end()
        return rows[0]
    }

    async getCategoryApById(id)
    {
        const connection = await mysql.createConnection(config)
        let [rows] = await connection.query(`
            SELECT * FROM pharmacy_categories
            WHERE
            id = ${id} 
            LIMIT 1
        `)
        await connection.end()
        return rows[0]
    }

    async pharmacyEdit(id, percent_done, month, current_month)
    {
        const connection = await mysql.createConnection(config)

        await connection.query(`UPDATE pharmacies SET percent_done='${percent_done}', month='${month}', current_month=${current_month} WHERE id="${id}"`)

        await connection.end()
    }

    async getOverfulfillmentMonthMoney(pharmacy_category_id, month, percent )
    {
        const connection = await mysql.createConnection(config)

        
        const [rows] =  await connection.query(`SELECT overfulfillment.${month} AS money FROM overfulfillment WHERE percent = ${percent} AND pharmacy_category_id = ${pharmacy_category_id} LIMIT 1`)

        await connection.end()

        return rows[0];
    }

    checkThreeMonths(num)
    {
        if(num < 3)
        {
            return (num+1)
            
        } 
     
        else return 1
    }

    async getBonusPartOne()
    {
        const connection = await mysql.createConnection(config)
        const {month_date} = await plan.getCurrentMonth();
        const [rows] = await connection.query(`SELECT * FROM bonuses_part_one WHERE currentDate="${plan.translateDateToStandardDate(month_date)}"`)

        return rows
    }


    async getBonusPartTwo()
    {
        const connection = await mysql.createConnection(config);
        const {month_date} = await plan.getCurrentMonth();
        const maxWorkDay = await pharmaciesModule.getMaxWorkDay();
        let [rows] = await connection.query(`
            SELECT
                pharmacies.short_name AS pharmacyShortName,
                pharmacies.num AS  pharmacyNum,
                pharmacy_staff.name AS fullname,
                pharmacy_staff.iin AS iin,
                pharmacy_staff.position AS position,
                pharmacy_staff.workDay AS workDay,
                bonuses_part_one.bonusPharmaciests AS bonusPharmaciests,
                bonuses_part_one.bonusSpecialists AS bonusSpecialists
            FROM pharmacy_staff
                INNER JOIN pharmacies ON pharmacies.id = pharmacy_staff.pharmacy_id
                INNER JOIN bonuses_part_one ON bonuses_part_one.pharmacy = pharmacies.short_name
            WHERE bonuses_part_one.currentDate = '${plan.translateDateToStandardDate(month_date)}'
        `);
        const testResults = await this.getCurrentResults_PH_TEST(`${plan.getZero(month_date.getFullYear())}-${plan.getZero(month_date.getMonth()+1)}-${plan.getZero(month_date.getDate())}`);
        for(let i = 0; i <  rows.length; i++)
        {
            
            if(rows[i].position.toLowerCase() == 'специалист') 
            {
                
                rows[i].bonusFromPartOne = rows[i].bonusSpecialists
                rows[i].overfullfilmentBonus = Math.trunc( +((rows[i].bonusFromPartOne/maxWorkDay)*rows[i].workDay))
            }
            else 
            {

                rows[i].bonusFromPartOne = rows[i].bonusPharmaciests
                rows[i].overfullfilmentBonus = Math.trunc( +((rows[i].bonusFromPartOne/maxWorkDay)*rows[i].workDay))
            }
            for(let j = 0; j < testResults.length; j++)
            {
                if(rows[i].iin == testResults[j].iin)  
                { 
                    
                    rows[i].percentTestResult = Math.trunc(+(testResults[j].resultPercent));
                    break
                }
            }
        }
        await connection.end()
        // console.log(rows[0])
        return rows        
    }




    // ПОЛУЧЕНИЕ ДАННЫХ С БАЗЫ PH_TEST
    async getCategoryByDate(date)
    {
        const connection = await mysql.createConnection(config_PH_TEST);
        const [rows] = await connection.execute(`SELECT * FROM test_categories WHERE date='${date}' LIMIT 1`);
        await connection.end();
        return rows[0]
    } 

    async getCurrentResults_PH_TEST(date)
    {
        const currentMonth = await this.getCategoryByDate(date)
        const connection =  await mysql.createConnection(config_PH_TEST);
        const [rows] = await connection.query(`
        SELECT 
            results.user_id AS userId,
            (results.current_ball * 100) / results.total_ball AS resultPercent,
            users.iin AS iin
        FROM results
            INNER JOIN test_categories ON results.category_id=test_categories.id
            INNER JOIN users ON results.user_id=users.id
        WHERE 
             
            results.retake = 0 AND 
            test_categories.id = results.category_id AND
            test_categories.date = '${currentMonth.date}'
        ORDER BY results.user_id ASC
        `);


        
        await connection.end()
        return rows
        
    }
}


module.exports = Bonus;

