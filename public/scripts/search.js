function search() {
    var input, filter, table, rows, row, i, txtValue, lines, line;
    input = document.getElementById('search');
    filter = input.value.toUpperCase();
    table = document.querySelector('.table');
    rows = table.getElementsByClassName('table-row');
    lines = table.getElementsByClassName('hr-container');

    for (i = 0; i < rows.length; i++) {
      row = rows[i];
      line = lines[i];
      txtValue = row.textContent || row.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        row.style.display = "";
        line.style.display = "";
      } else {
        row.style.display = "none";
        line.style.display = "none";
      }
    }
}

function answered(){
    const answeredFilter = document.querySelector('.answered-filter-button');
    var table, rows, row, i, txtValue, lines, line;
    table = document.querySelector('.table');
    rows = table.getElementsByClassName('table-row');
    lines = table.getElementsByClassName('hr-container');

   
    answeredFilter.addEventListener('click', ()=>{
        for (i = 0; i < rows.length; i++){
            row = rows[i];
            line = lines[i];
            txtValue = row.textContent || row.innerText;
            if (txtValue.indexOf('Not Answered') > -1){
                row.style.display = "none";
                line.style.display = "none";
            } else {
                row.style.display = "";
                line.style.display = "";
            }
        } 
    })
}

function notAnswered(){
    const answeredFilter = document.querySelector('.not-answered-filter-button');
    var table, rows, row, i, txtValue, lines, line;
    table = document.querySelector('.table');
    rows = table.getElementsByClassName('table-row');
    lines = table.getElementsByClassName('hr-container');

   
    answeredFilter.addEventListener('click', ()=>{
        for (i = 0; i < rows.length; i++){
            row = rows[i];
            line = lines[i];
            txtValue = row.textContent || row.innerText;
            if (txtValue.indexOf('Not Answered') > -1){
                row.style.display = "";
                line.style.display = "";
            } else {
                row.style.display = "none";
                line.style.display = "none";
            }
        } 
    })
}

document.addEventListener('DOMContentLoaded', (event) => {
    answered();
    notAnswered();
});