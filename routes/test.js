const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth')
const Plan = require('../modules/plan')
const plan = new Plan();



router.get('/', auth, async (req, res) => {
        res.render('test', {
            title: 'TEST',
            isTest:  true
        });
        console.log(await plan.getApIdByText('Аптека №113"Сайрам"'))

        
       
})

router.post('/', auth, async (req, res) => {
    try{
        console.log(req.file)
        if(!req.file)
        {
           req.flash('error', 'Ошибка при загрузке файла');
           return res.redirect('/test');
        }
     
        // формирование таблицы для подтверждения
        const Excel = require('exceljs');
        let filename = 'files/'+req.file.filename;
        let workbook = new Excel.Workbook();
        await workbook.xlsx.readFile(filename);
        let worksheet =  workbook.worksheets[0];
        let rowsLength = worksheet._rows.length;
        let columsLength = worksheet._columns.length;
        let dataFromFile = [];


        for(let i = 1; i < rowsLength+1; i++)
        {   
          
            for(let j = 1; j < columsLength+1;)
            {
                dataFromFile.push({
                    ap:`${worksheet.getRow(i).getCell(j).value}`,
                    plan:`${+(worksheet.getRow(i).getCell(j+1).value).toFixed(2)}` 
                })
                break

            }
        }
       
        res.render('testTable', {
            title: 'Test Table',
            isTest: true,
            items: dataFromFile

        })
    }
    catch(e)
    {
        console.log(e);

    }

});

router.post('/uloadPlan', auth, async (req, res)=> {
    res
});





module.exports = router;