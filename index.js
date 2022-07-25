require('dotenv').config()

const express = require('express');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const config = require('./config');


const MySQLStore = require('connect-mysql')(session);
const options = {
    config,
    cleanup: true,
    keepalive: 500000000,
    table: 'sessions'
};
// routers
const homeRoutes = require('./routes/home');
const adminRoutes = require('./routes/admin');
const planRoutes = require('./routes/plan');
const studyRoutes = require('./routes/study');

const testRoutes = require('./routes/test');




let app = express();
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', 'views');



app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({extended: true}));



app.use(session({
    secret: '1254gdfghth!кререждрнге?3453-6аролшур',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        expires: 1000 * 60 * 60 * 24 * 3
      },
    store: new MySQLStore(options) 
}));



const varMiddleware = require('./middleware/variables');
const fileMiddleware = require('./middleware/file');

app.use(flash());
app.use(varMiddleware);
app.use(fileMiddleware.single('test'));


app.use('/', homeRoutes);
app.use('/admin', adminRoutes);
app.use('/test', testRoutes);
app.use('/plan', planRoutes);
app.use('/study', studyRoutes);





app.get('/*', (req,res) => {
    res.send('Страница не найдена')
})


function start()
{
    try
    {
        const PORT = process.env.PORT || 666;
        
        app.listen(PORT, () => {
            console.log(`Server is running - ${PORT}`);
        });
    }
    catch(e)
    {
        console.log(e);
    }
}

start();

 