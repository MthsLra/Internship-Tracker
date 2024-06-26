tableArray = [{
    role: "Swe",
    company: "Google",
    salary: "$12,000"
}, {
    role: "AI / ML",
    company: "Microsoft",
    salary: "???"
}];

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

document.querySelector('js-add-button').addEventListener('click', () => {
    addRow();
});

function addRow(){
    const roleInput = document.querySelector('role-input');
    const role = roleInput.value;

    const companyInput = document.querySelector('company-input');
    const company = companyInput.value;
    
    const salaryInput = document.querySelector('salary-input');
    const salary = salaryInput.value;

    tableArray.push({role, company, salary});

    roleInput = '';
    companyInput = '';
    salaryInput = '';

    renderTable();

}



/*

const roleInput = document.getElementById('.idRole');
const companyInput = document.getElementById('.idCompany');
const salaryInput = document.getElementById('.idSalary');

const addButton = document.getElementById('.js-add-button');

addButton.addEventListener('click', () => {
    const roleValue = roleInput.value;
    const companyValue = companyInput.value;
    const salaryValue = salaryInput.value;
    
    let tableArray = JSON.parse(localStorage.getItem('tableArray')) || [];

    tableArray.push(roleValue);
    tableArray.push(companyValue);
    tableArray.push(salaryValue);

    localStorage.setItem('tableArray', JSON.stringify(tableArray));

    console.log(tableArray);

});
*/