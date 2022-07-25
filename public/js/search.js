document.addEventListener('DOMContentLoaded', () => {
    const tr = document.querySelectorAll('.search__item');
    const search = document.querySelector('.input__search');

    search.addEventListener('keyup', () => {
        if(search.value.length > 0)
        {
            for(let i = 0; i < tr.length; i++)
            {
                if(((tr[i].innerText.trim().toLowerCase().substr(0,tr[i].innerText.trim().length - 7))).trim().indexOf(search.value.trim().toLowerCase()) > -1)
                {
                    tr[i].classList.remove('hidden')
                } else {
                    tr[i].classList.add('hidden')
                }
            }
        
        } else {
            for(let i = 1; i < tr.length; i++)
            {
                tr[i].classList.remove('hidden')
            }
        }
    })

});
