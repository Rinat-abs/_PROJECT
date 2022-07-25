document.addEventListener('DOMContentLoaded', () => {
    let 
    editBtns = document.querySelectorAll('.table__hygiene>.table__price__img'),
    editInputs = document.querySelectorAll('.table__hygiene>input[name="money_hygiene"]'),
    editTextPrice = document.querySelectorAll('.table__hygiene>.price'),
    saveBtns = document.querySelectorAll('.table__hygiene>.save_price'),
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
        btn.setAttribute("data-money_hygiene",editInputs[i].value)
        btn.classList.add('hidden')


        const 
            id = event.target.dataset.id,
            money = event.target.dataset.money_hygiene;

      
            fetch('/plan/edit_pharmacy_category/hygiene/' + id + '/' + money, {
                method: 'post'
            })
            .then(res => {
              
                if(!res.ok)
                {
                    
                    window.location.href='/plan/pharmacy_categories'

                    
                
                }
            })

 
        
        
    })
})




});