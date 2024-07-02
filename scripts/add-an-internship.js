tableArray = JSON.parse(localStorage.getItem('table'));
console.log(tableArray)

renderTable();

function renderTable(){
    let tableHTML = '';

    tableArray.forEach((tableObject, index) => {
        const {role, company, salary} = tableObj