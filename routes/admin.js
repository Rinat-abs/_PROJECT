const {Router} = require('express');
const router = Router();
const auth = require('../middleware/auth')

router.get('/', auth, (req, res) => {
        res.render('admin', {
            title: 'Панель администратора',
            isAdmin:  true
        })
})





module.exports = router;