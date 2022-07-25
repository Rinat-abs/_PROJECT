document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.small_fadeout_block');
    if(modal)
    {
        setTimeout(() => {
            modal.remove();
        }, 10000)
        let body = document.querySelector('body')
        const modal__close__btn = document.querySelector('#modal__close-button');
        modal__close__btn.addEventListener('click', (e)=> {
            modal.remove();
            
        })
        
    }
   
});

