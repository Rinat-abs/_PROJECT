const {body} = require('express-validator/check');
const { param } = require('express/lib/request');
const Plan = require('../modules/plan')
const plan = new Plan()
// const User = require('../modules/user');

// const user = new User();

exports.loginValidation = [
    body('login').trim().isAlphanumeric('en-US').withMessage('Введите корректный логин'),
    body('password').trim().isAlphanumeric('en-US').withMessage('Введите корректный пароль'),
    
]




exports.pharmacyValidation = [
    body('full_name').trim().isLength({min: 12}).withMessage('Минимальная длина полного наименования аптеки 12 символов'),
    body('full_name').trim().custom( async(value, {req}) => {
        if(value.includes('Аптека №'))
        {
            if(value.includes(req.body.num))
            {
                if(!(await plan.getPharmacyByNum(req.body.num)))
                {
                    return true
                } else 
                {
                    throw new Error('Данная аптека уже добавлена');
                }
                
            }
            else
            {
            
                throw new Error('Номер аптеки не совпадает с номером в наименовании аптеки');
            }
            
        }
        else
        {
           
            throw new Error('Названия аптеки указано неверно');
        }
    }),
    body('num').trim().isInt().isLength({min: 1, max:4} ).withMessage('Номер аптеки указан неверно')
]

