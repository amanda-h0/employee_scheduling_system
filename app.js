const express = require("express")
const business = require("./business.js")
const bodyParser = require("body-parser")

const app = express()
app.use(bodyParser.urlencoded({extended: false}))

/**
 * Displays a list of all employees.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
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

/**
 * Shows details and shifts of a specific employee.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
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

/**
 * Displays the edit form for an employee.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
app.get('/edit/:id', async (req, res) => {

    let id = req.params.id
    let employees = await business.allEmployees()
    let employee = null

    for (let e of employees) {
        if (e.employeeId === id) {
            employee = e
        }
    }

    if (!employee) {
        return res.send("Employee not found")
    }

    let result = '<h1>Edit</h1>'
    result += "<form method='POST' action='/edit/" + id + "'>"
    result += "Name: <input type='text' name='name' value='" + employee.name + "'><br>"
    result += "Phone: <input type='text' name='phone' value='" + employee.phone + "'><br>"
    result += "<button type='submit'>Save</button>"
    result += "</form>"

    res.send(result)
})

/**
 * Handles the submission of edited employee details.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
app.post('/edit/:id', async (req, res) => {

    let id = req.params.id
    let name = req.body.name
    let phone = req.body.phone

    if (name) {
        name = name.trim()
    }
    if (phone) {
        phone = phone.trim()
    }

    if (!name || name.length === 0){
        return res.send('Name must not be empty.<br>' +
            `<a href='/edit/${id}'>Back to Edit Details</a>`)
    }
    if (!/^\d{4}-\d{4}$/.test(phone)) {
        return res.send('Phone must be in the following format: 4 digits. dash (-), 4 digits.<br>' +
            `<a href='/edit/${id}'>Back to Edit Details</a>`)
    }

    const db = await require('./persistence').connectDatabase()
    await db.collection('employees').updateOne(
        { employeeId: id},
        {$set: {name: name, phone: phone}}
    )

    res.redirect('/')
})

/**
 * Starts the Express server on port 8000.
 */
app.listen(8000, () => {
    console.log("Server running on http://127.0.0.1:8000")
})