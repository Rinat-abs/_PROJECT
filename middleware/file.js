const multer = require('multer');
const uuid = require('uuid').v4;

const storage = multer.diskStorage(
{
    destination(req, file, cd)  {
        cd(null, 'files')
    }, 

    filename(req, file, cd) 
    {
        cd(null, uuid()+'.xlsx');
    }

    
});




const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

const fileFilter = (req, file, cb) => 
{
   
    if (allowedTypes.includes(file.mimetype))
    {
        cb(null, true);
    }
    else 
    {
        cb(null, false);
    }


    
}

module.exports = multer(
{
    
    storage,
    fileFilter,
    limits: {
        fileSize: 1048576
    } 

})