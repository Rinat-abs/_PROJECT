const {Router} = require('express')
const router = new Router()
const 
    Study = require('../modules/study'),
    study = new Study(),
    Plan = require('../modules/plan'),
    plan = new Plan();

const  
    auth = require('../middleware/auth'),
    isMas = require('../middleware/isMas');

router.get('/',auth, isMas, async(req, res) => {

    const categories  = await study.getCategories()
    res.render('study', {
        title: 'Обучение',
        isMas: true,
        categories
        
    })
})

router.get('/:id',auth, isMas, async(req, res) => {
    const currentCategory = await plan.getCurrentMonth()
    
    if(currentCategory.id == req.params.id)
    {
        res.render('studyCheck', {
            title: 'Обучение',
            isMas: true,
           
            
        })
    }
    else {
        const categories  = await study.getCategories()
        res.render('study', {
            title: 'Обучение',
            isMas: true,
            categories
            
        })
    }
    
})

module.exports = router


 