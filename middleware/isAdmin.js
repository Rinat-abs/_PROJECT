module.exports = function (req, res, next) 
{
   if (req.session.user.rights != 'admin')
   {
        return res.redirect('/');
   }  
   next()   
}