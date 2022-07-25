document.addEventListener('DOMContentLoaded', () => {
    let 
    editBtns = document.querySelectorAll('.table__price__img'),
    editInputs = document.querySelectorAll('.table__price>input[name="price"]'),
    editTextPrice = document.querySelectorAll('.price'),
    saveBtns = document.querySelectorAll('.save_price'),
    priceBeforeEdit = 0
editBtns.forEach((btn, i)=> {
    btn.addEventListener('click', () => {
        priceBeforeEdit = editInputs[i].value
        editTextPrice[i].classList.add('hidden')
        editInputs[i].setAttribute("type", "number")
        saveBtns[i].classList.remove('hidden')
        btn.classList.add('hidden')
    })
})

editTextPrice.forEach((btn, i)=> {
    btn.addEventListener('dblclick', () => {
        priceBeforeEdit = editInputs[i].value
        editTextPrice[i].classList.add('hidden')
        editInputs[i].setAttribute("type", "number")
        saveBtns[i].classList.remove('hidden')
        editBtns[i].classList.add('hidden')
        
    })
})

saveBtns.forEach((btn, i)=> {
    btn.addEventListener('click', (event) => {
        
        editTextPrice[i].innerHTML = editInputs[i].value
        editTextPrice[i].classList.remove('hidden')
        editInputs[i].setAttribute("type", "hidden")
        editBtns[i].classList.remove('hidden')
        btn.setAttribute("data-plan",editInputs[i].value)
        btn.classList.add('hidden')


        const 
            id = event.target.dataset.id,
            plan = event.target.dataset.plan;

      
            fetch('/plan/edit/' + id + '/' + plan, {
                method: 'post'
            })
            .then(res => {
              
                if(!res.ok)
                {
                     
                    window.location.href='/plan/current_month'

                    // btn.setAttribute("data-plan",priceBeforeEdit)
                    // editTextPrice[i].innerHTML = priceBeforeEdit
                    
                //     document.querySelector('body').innerHTML += `
                //     <div class="small_fadeout_block small_fadeout_block_error animate__animated animate__backInDown" >
                //     <button class="modal__close-button" id="modal__close-button" onclick="document.querySelector('.small_fadeout_block').remove();  ">
                //     <img src="/img/close.svg" width="14" alt="" >
                //     </button>
                //     <h3>Ошибка</h3>
                //     <p>Что то пошло не так <br> Проверьте введенные данные </p>
                //     <p>Перезагрузите страницу </p>
                //     </div>
                    
                //     `
                }
            })

 
        
        
    })
})




});