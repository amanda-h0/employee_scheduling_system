const express = require("express")
const business = require("./business.js")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', async (req, res) => {

    let employees = await business.allEmployees()

    let result = '<h1>List of Employees</h1>'
    result += '<ul>'

    for (let e of employees) {
        result += '<li>'
        result += "<a href='/employee/" + e.employeeId + "'>"
        result += e.name
        result += "</a>"
        result += "</li>"
    }
    
    result += "</ul>"
    res.send(result)
})

app.get('/employee/:id', async (req, res) => {

    let id = req.params.id
    let schedule = await business.getEmployeeSchedule(id)

    if (schedule.message && schedule.message.length > 0) {
        return res.send(schedule.message)
    }

    let employees = await business.allEmployees()
    let employee = null

    for (let e of employees) {
        if (e.employeeId === id) {
            employee = e
        }
    }

    let result = '<h1>Employee Details</h1>'

    result += '<p>Name: ' + employee.name + '</p>'
    result += '<p>Phone: ' + employee.phone + '</p>'
    result += "<a href='/edit/" + employee.employeeId + "'>Edit Details</a>"

    result += '<h2>Shifts</h2>'
    result += "<table border = '1'>"
    result += '<tr><th>Date</th><th>Start</th><th>End</th>'

    for (let r of schedule.records) {
        result += '<tr>'
        result += '<td>' + r.date + '</td>'

        let hour = Number(r.startTime.split(':')[0])
        if (hour < 12) {
            result += "<td style='background-color:yellow'>" + r.startTime + "</td>"
        } else {
            result += "<td>" + r.startTime + "</td>"
        }

        result += '<td>' + r.endTime + '</td>'
        result += '</tr>'
    }

    result += '</table>'
    res.send(result)
})

app.listen(8000, () => {
    console.log("Server running on http://127.0.0.1:8000")
})