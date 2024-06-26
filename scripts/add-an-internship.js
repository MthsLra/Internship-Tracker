tableArray = JSON.parse(localStorage.getItem('table'));
console.log(tableArray)

renderTable();

function renderTable(){
    let tableHTML = '';

    tableArray.forEach((tableObject, index) => {
        const {role, company, salary} = tableObject;
        const html = `
                    <div class="table-row">
                        <div class="table-column-role">${role}</div>
                        <div class="table-column-company">${company}</div>
                        <div class="table-column-salary">${salary}</div>
                        <div class="table-column-state">Not answered</div>
                    </div>

                    <div class="hr-container"><hr class="horizontal-line"></hr></div>
                    
            `;
        tableHTML += html;
    });

    document.querySelector('.table').innerHTML = tableHTML;
}


document.querySelector('.add-button').addEventListener('click', () => {
    addRow();
    localStorage.setItem('table', JSON.stringify(tableArray));
});



function addRow(){
    const roleInput = document.querySelector('.role-input');
    const role = roleInput.value;

    const companyInput = document.querySelector('.company-input');
    const company = companyInput.value;
    
    const salaryInput = document.querySelector('.salary-input');
    const salary = salaryInput.value;

    tableArray.push({role, company, salary});


    renderTable();
}


