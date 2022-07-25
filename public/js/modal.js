document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('#modal');
    if(modal)
    {
        let body = document.querySelector('body')
        const modal__close__btn = document.querySelector('#modal__close-button');
        body.style.overflow = 'hidden'
        modal__close__btn.addEventListener('click', (e)=> {
            modal.remove();
            body.style.overflow = 'auto'
        })
        modal.addEventListener('click', (e)=> {
            
            let target = e.target
            if(target.closest('#modal') && !target.closest('.modal__content') && !target.closest('.modal__close-button') && !target.closest('.modal__title')  && !target.closest('.modal__descruption'))
            {
                modal.remove();
                body.style.overflowY = 'scroll'

            } 

            

            // if(modal.classList[0] === 'modal')
            // {
            //     // modal.remove();
            // }
        })
    }
   
});