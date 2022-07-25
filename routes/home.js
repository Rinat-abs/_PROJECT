const {Router} = require('express');
const router = Router();
const ifAuth = require('../middleware/ifAuth')
const {validationResult} = require('express-validator/check');
const {loginValidation} = require('../utils/validators');
const User = require('../modules/user');
const userModule = new User();


router.get('/',  (req, res) => {
        if(req.session.isAuth)
        {


            res.render('home', {
                title: 'Главная страница',
                user: res.locals.user,
                isHome: true
                
            })
        } else 
        {
            res.render('homeAuth', {
                title: 'Авторизация',
                error: req.flash('error'),
                data: {
                    login: ''
                }
            })
        }
        
})

router.post('/auth', ifAuth, loginValidation, async (req, res) => {
    try
    {
        const {login, password} = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty())
        {
            req.flash('error', errors.array()[0].msg)
            return res.status(422).render('homeAuth', {
                title: 'Авторизация',
                error: req.flash('error'),
                data: {
                    login
                }
            })
        }

        const user = await userModule.checkLogin(login, password) ;
        if(user)
        {
            req.session.user = user;
            req.session.isAuth = true;
            req.session.save(err => {
                if (err)
                {
                    throw err
                }
                if( req.session.user.rights === 'admin' )
                {
                    res.redirect('/admin')
                } else 
                {
                    res.redirect('/')
                }
            })
        } else {
            req.flash('error', 'Неверный логин или пароль, попробуйте ещё раз');
            res.status(422).render('homeAuth', {
                title: 'Авторизация',
                error: req.flash('error'),
                data: {
                    login
                }
            });
        }
    }
    catch(e)
    {
        console.log(e);
        res.redirect('/');
    } 
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');

    })
});



module.exports = router;