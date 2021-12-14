/* import moment from 'moment'
const fechaActual = moment().format('DD-MM-YYYY').toString() */
// Una semana tiene 24*7=168 horas
$(document).ready(function () {
    const fechaActual = new Date()
    const dateFrom = document.querySelector('input[name=dateFrom]').value
    const dateTo = document.querySelector('input[name=dateTo]').value
    console.log(dateFrom, 'desde', dateTo, 'hasta')
    const Now = fechaActual.toISOString()
    console.log(Now, 'ISO DATE')

    const myArray = [
        { name: 'dateFrom', date: '2011-01-28T08:00:00Z', totalSales: 0 },
        { name: 'dateTo', date: '2009-11-25T08:00:00Z', totalSales: 0 }
    ]

    console.log(myArray.sort())
    let result
    result = myArray.filter(a => a > dateFrom && a < dateTo)
})
