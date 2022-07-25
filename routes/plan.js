const {Router} = require('express');
const router = Router();

const 
    auth = require('../middleware/auth'),
    isMain = require('../middleware/isMain');


const 
    fs = require('fs'),
    Plan = require('../modules/plan'),
    Fact = require('../modules/fact'),
    Bonus = require('../modules/bonus'),
    Pharmacies = require('../modules/pharmacies'),
    plan = new Plan(),
    fact = new Fact(),
    bonus = new Bonus(),
    pharmaciesStaff = new Pharmacies()

const 
    {validationResult} = require('express-validator/check'),
    {pharmacyValidation} = require('../utils/validators');



router.get('/', auth, isMain, (req, res) => {
        res.render('plan', {
            title: 'План',
            isMain:  true,
            error: req.flash('error')
        })
});





//################   ПЛАН ПРОДАЖ ЗА ТЕКУЩИЙ МЕСЯЦ    ################

router.get('/current_month', auth, isMain, async (req, res) => {
    const items = await plan.getCurrentPlan()

    res.render('planCurrent', {
        title: 'План',
        isMain:  true,
        items,
        error: req.flash('error'),
        success: req.flash('success')
    })
});



router.get('/upload', auth, isMain, (req, res) => {
    res.render('planUpload', {
        title: 'План',
        isMain:  true,
        error: req.flash('error'),
        
    })
});


router.post('/', auth,isMain, async (req, res) => {
    try{
      
        if(!req.file)
        {
           req.flash('error', 'Ошибка при загрузки файла');
           return res.redirect('/plan/upload');
        }
     
        // формирование таблицы для подтверждения
        const Excel = require('exceljs');
        let filename = 'files/'+req.file.filename;
        let workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filename);
        let 
            worksheet =  workbook.worksheets[0],
            rowsLength = worksheet._rows.length,
            columsLength = worksheet._columns.length,
            dataFromFile = [];
        for(let i = 2; i < rowsLength+1; i++) 
        {   
            for(let j = 1; j < columsLength+1;)
            {   
                try
                {
                    if( !worksheet.getRow(i).getCell(j).value || !(worksheet.getRow(i).getCell(j).value).includes("Аптека"))
                    {
                        break
                    } else 
                    {
                        
                        let ap = await plan.getApIdByText(worksheet.getRow(i).getCell(j).value);
                        if(!ap)
                        {
                            
                            fs.unlinkSync('files/'+req.file.filename);
                            let error = `Ошибка, проверьте оформление файла в строке: <strong>${i}</strong>`;
                            try
                            {
                                if((worksheet.getRow(i).getCell(j).value).includes('Аптека') || (worksheet.getRow(i).getCell(j).value).includes('аптека'))
                                {
                                    error +=`<br> Возможно не создана аптека: ${worksheet.getRow(i).getCell(j).value}`
                                }
                            } catch(e)
                            {
                                console.log(e);
                            }
                            req.flash('error', error)
                            res.redirect('/plan/upload')
                        }
                      
                        dataFromFile.push({
                            ap: ap,
                            plan:`${+(worksheet.getRow(i).getCell(j+2).value)}`,
                            
                        })
                    }
                    
                }
                catch(e)
                {   
                    fs.unlinkSync('files/'+req.file.filename);
                    console.log(e)
                    req.flash('error',  `Ошибка, проверьте оформление файла в строке <strong>${i}</strong>`)
                    res.redirect('/plan/upload')
                }
                break

            }
        }

        res.render('planFileConfirm', {
            title: 'Подтверждение загружаемого файла',
            isMain: true,
            items: dataFromFile,
            itemsJSON: JSON.stringify(dataFromFile),
            filename
        })
    }
    catch(e)
    {
        fs.unlinkSync('files/'+req.file.filename);
        
        req.flash('error', 'Ошибка при загрузки файла')
        console.log(e);
        res.redirect('/plan/upload')
        

    }

});



router.post('/uloadPlan', auth, isMain, async (req, res)=> {
    try 
    {
        const
        items = req.body.items,
        filename = req.body.filename;
        fs.unlinkSync(`${filename}`);
        let user = res.locals.user.name + ' ' + res.locals.user.lastname;
        await plan.uploadPlan(JSON.parse(items), user);
        req.flash('success', 'Данные успешно загружены')
        res.redirect('/plan/current_month');
    } catch(e)
    {
        req.flash('error', 'Ошибка при загрузки файла')
        console.log(e)
        res.redirect('/plan/upload')
        

    }
    
    
});

router.post('/uloadRefuse', auth, isMain, async (req, res)=> {
    try 
    {
        filename = req.body.filename;
        fs.unlinkSync(`${filename}`);
    } catch(e)
    {   
        
        console.log(e)

    }
    res.redirect('/plan');
    
});

// Редактирование данных без перезагрузки через fech!!!!!!!!!!!
router.post('/edit/:id/:editPlan', auth, isMain, async (req, res) => {
    try
    {
        const {id, editPlan} = req.params;
        await plan.editPlan(id, editPlan)
        res.status(200)
    }
    catch(e)
    {
        console.log(e)
        req.flash('error', "Что то пошло не так")
        res.status(500).send('Ошибка')
        
       
    
        
    }
  })
//-------------------  ПЛАН ПРОДАЖ ЗА ТЕКУЩИЙ МЕСЯЦ    -------------------






//################   ФАКТ ПРОДАЖ ЗА ТЕКУЩИЙ МЕСЯЦ    ################

router.get('/current_month_fact', auth, isMain, async(req, res) => {

   try
   {
        const facts = await fact.getCurrentFact();
        const filePath = "\\\\192.168.0.25\\BonusPharma\\JSONFiles\\factsell.json"
        const stats = fs.statSync(filePath);
        let date_file = (`${plan.getZero(stats.ctime.getDate())}.${plan.getZero(stats.ctime.getMonth()+1)}.${plan.getZero(stats.ctime.getFullYear())} ${plan.getZero(stats.ctime.getHours())}:${plan.getZero(stats.ctime.getMinutes())}`)
        
        res.render('factCurrent', {
            title: 'Факт продаж',
            isMain:  true,
            error: req.flash('error'),
            success: req.flash('success'),
            facts,
            date_file
        });
    } catch(e)
    {
        req.flash('error', e)
        res.redirect('/plan')
        console.log(e)
    }
    
    
});


router.post('/fact_upload', auth, isMain, async(req, res) => {
    try
    {
        const _path_to_files_derictory = "\\\\192.168.0.25\\BonusPharma\\JSONFiles\\";
        let 
            dataFromFile=[],
            filePath = `${_path_to_files_derictory}factsell.json`;
            fileFact = fs.readFileSync(filePath, "utf8");

        filePath = `${_path_to_files_derictory}BonusSangigiena.json`;
        let fileFactHygiene = fs.readFileSync(filePath, "utf8");
        filePath = `${_path_to_files_derictory}AskorbinkaBonus.json`;
        let fileFactAskorbinkaBonus = fs.readFileSync(filePath, "utf8");
        filePath = `${_path_to_files_derictory}PharmaBonus.json`;
        let filePharmaBonus = fs.readFileSync(filePath, "utf8");


        let 
            user = res.locals.user.name + ' ' + res.locals.user.lastname,
            sellFacts = JSON.parse(fileFact),
            sellFactsHygiene = JSON.parse(fileFactHygiene),
            sellAskorbinkaBonus = JSON.parse(fileFactAskorbinkaBonus)

        filePharmaBonus = JSON.parse(filePharmaBonus);

        for(let i = 0; i < sellFacts.length; i++)
        {
            let ap = await plan.getApIdByText(sellFacts[i].Pharma);
            sellFacts[i].SellFact = plan.replaceCommasWithDots(sellFacts[i].SellFact)
           
            if(!ap)
            {
                console.log(`ОШИБКА \n ########################################## \n ${sellFacts[i].Pharma} \n ########################################## \n`)
                req.flash('error',  `Возможно не создана аптека: ${sellFacts[i].Pharma}`)
                return res.redirect('/plan')
              
                
            } else {

                sellFactsHygiene.forEach((item) => {
                    
                    if(ap.full_name.slice(0, 20) === item.Pharma.slice(0, 20))
                    {
                        dataFromFile.push({
                            ap: ap,
                            fact:+(sellFacts[i].SellFact),
                            hygienePlan: +plan.replaceCommasWithDots(item.SangigienaPlan),
                            hygieneFact: +plan.replaceCommasWithDots(item.SangigienaFact),
                            hygienePercent: +plan.replaceCommasWithDots(item.SangigenaPercent),
                            commonProvidersSells: +plan.replaceCommasWithDots(item.CommonProvidersSells)
                            
                        })
                        return false
                        
                    }

                })

                sellAskorbinkaBonus.forEach((item) => {
                    const desiredIdx = dataFromFile.length - 1;
                    if(dataFromFile[desiredIdx].ap.full_name.slice(0, 20) === item.Pharma.slice(0, 20))
                    {
                        
                        dataFromFile[desiredIdx].askorbinkaBonusFact = +plan.replaceCommasWithDots(item.FactSummSell)
                        
                        return false
                    }
                    
                })

                filePharmaBonus.forEach((item) => {
                    const desiredIdx = dataFromFile.length - 1;
                    if(dataFromFile[desiredIdx].ap.full_name.slice(0, 20) === item.Pharma.slice(0, 20))
                    {
                        
                        dataFromFile[desiredIdx].commonBonus = +plan.replaceCommasWithDots( item.CommonBonus)
                        dataFromFile[desiredIdx].lsBad = +plan.replaceCommasWithDots( item.LsBad)
                        dataFromFile[desiredIdx].fito = +plan.replaceCommasWithDots( item.Fito)
                        dataFromFile[desiredIdx].insurance = +plan.replaceCommasWithDots( item.Insurance)
                        
                        return false
                    }
                    
                })
            }
           

            
            
        }

        
        // console.log(dataFromFile[0])
        await fact.uploadFact(dataFromFile, user)
        await pharmaciesStaff.uploadPharmaciesStaff()
        req.flash('success', 'Данные успешно обновлены')
        res.redirect('/plan/current_month_fact')
    } catch(e)
    {
        req.flash('error', 'Что - то пошло не так')
        console.log(`ОШИБКА \n ########################################## \n ${e} \n ########################################## \n`);
        res.redirect('/plan')
    }
});






//------------------- ФАКТ ПРОДАЖ ЗА ТЕКУЩИЙ МЕСЯЦ    -------------------




//################   АПТЕКИ    ################

router.get('/pharmacies', auth, isMain, async (req, res) => {
    const pharmacies = await plan.getPharmacies();
    res.render('pharmacies', {
        title: 'Аптеки',
        isMain:  true,
        pharmacies,
        error: req.flash('error')
    })
});

router.get('/add_pharmacy', auth, isMain, async (req, res) => {
    res.render('addPharmacy', {
        title: 'Добавить аптеку',
        isMain:  true,
        data: {
            full_name:'',
            num: ''
        },
        error: req.flash('error'),
        success: req.flash('success')
    })
});

router.post('/add_pharmacy', auth, isMain, pharmacyValidation, async (req, res) => {

    try
    {
        const {num, full_name} = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            req.flash('error', errors.array()[0].msg)
            return res.status(422).render('addPharmacy', {
                title: 'Добавить аптеку',
                isMain:  true,
                error: req.flash('error'),
                data: {
                    full_name,
                    num
                },
                success: ''
            })
        } else 
        {
            try 
            {
                
                plan.addPharmacy(full_name, num);
                req.flash('success',full_name )
                res.redirect('/plan/add_pharmacy');
            } catch(e)
            {
                console.log(e)
                req.flash('error', 'Что то пошло не так')
                return res.status(422).render('addPharmacy', {
                    title: 'Добавить аптеку',
                    isMain:  true,
                    error: req.flash('error'),
                    data: {
                        full_name,
                        num
                    },
                    success: ''
                })
            }
        }
        
        
    }catch(e)
    {
        req.flash('error', 'Что-то пошло не так');
        res.redirect('/plan/add_pharmacy');
        console.log(e);
    }
    
});

// router.get('/update_staff', async (req, res) => {
//     await pharmaciesStaff.uploadPharmaciesStaff()
//     res.redirect('/plan/pharmacies')
// })

// Категории аптек
router.get('/pharmacy_categories', auth, isMain, async (req, res) => {
    try
    {
        
        const items = await plan.getPharmacyCategories()   
        res.render('pharmacyCategories', {
            title: 'План',
            isMain:  true,
            items,
            error: req.flash('error'),
            success: req.flash('success')
        })
    }
    catch(e)
    {
        console.log(e)
    }
});

// Редактирование данных достижения плана в категории аптек без перезагрузки через fech!!!!!!!!!!!
router.post('/edit_pharmacy_category/money/:id/:editMoney', auth, isMain, async (req, res) => {
    try
    {
        const {id, editMoney} = req.params;
      
        await plan.editPharmacyCategories(id, editMoney)
        res.status(200)
    }
    catch(e)   
    {
        console.log(e)
        req.flash('error', "Что то пошло не так")
        res.status(500).send('Ошибка')
        
       
    
        
    }
})

router.post('/edit_pharmacy_category/hygiene/:id/:editMoneyHygiene', auth, isMain, async (req, res) => {
    try
    {
        const {id, editMoneyHygiene} = req.params;
      
        await plan.editPharmacyCategoriesHygiene(id, editMoneyHygiene)
        res.status(200)
    }
    catch(e)   
    {
        console.log(e)
        req.flash('error', "Что то пошло не так")
        res.status(500).send('Ошибка')
        
       
    
        
    }
})

router.post('/edit_pharmacy_category/revenue/:id/:revenue', auth, isMain, async (req, res) => {
    try
    {
        const {id, revenue} = req.params;

        await plan.editPharmacyCategoriesRevenue(id, revenue)
        res.status(200)
    }
    catch(e)   
    {
        console.log(e)
        req.flash('error', "Что то пошло не так")
        res.status(500).send('Ошибка')
        
       
    
        
    }
})






//------------------- АПТЕКИ    -------------------





//################   БОНУСЫ    ################

router.get('/bonus_part_one', auth, isMain, async (req, res) => {
    try 
    {
        const items = await bonus.getBonusPartOne()
        res.render('bonusCurrent', {
            title: 'Бонус',
            items,
            isMain:  true,
            error: req.flash('error')
        })
    }
    catch(e)
    {
        console.log(e)
        req.flash('error', 'Что то пошло не так')
    }
});

router.post('/bonus_part_one_update', auth, isMain, async (req, res) => {
    try
    {
        await bonus.createBonusPartOne()
        
        res.redirect('/plan/bonus_part_one')
    }
    catch(e)
    {
        console.log(e)
        res.redirect('/plan/bonus_part_one')
    }
})

router.get('/bonus_part_two', auth, isMain, async (req, res) => {
    try 
    {
       
        await pharmaciesStaff.uploadPharmaciesStaff()
        const items = await bonus.getBonusPartTwo()
        res.render('bonusCurrentTWO', {
            title: 'Бонус',
            items,
            isMain:  true,
            error: req.flash('error')
        })
    } 
    catch(e)
    {
        console.log(e)
        req.flash('error', 'Что то пошло не так')
        res.redirect('/plan')
    }
})



//------------------- БОНУСЫ    -------------------


//################   Файлы для загрузки    ################


// Скачивание документа в Эксель формате первая часть бонусы
router.get('/download/bonusPartOne', auth, isMain,  (req, res) => {
    const filename = 'files/files_ready/part_1_bonus.xlsx';
    
    res.download(filename)
})

//------------------- Файлы для загрузки  -------------------

module.exports = router;