const express = require("express")
const persistence = require("./persistence.js")
const business = require("./business.js")
const bodyParser = require("body-parser")
const cookieParser = require('cookie-parser')

const app = express()
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())

async function authMiddleware(req, res, next) {
    let sessionId = req.cookies.sessionId

    if (!sessionId) {
        return res.redirect('/login?msg=Please login')
    }

    let session = await persistence.getSession(sessionId)

    if (!session || new Date(session.expiry) < new Date()) {
        return res.redirect('/login?msg=Session expired')
    }

    // extend session
    let newExpiry = new Date(Date.now() + 1000*60*5)
    await persistence.updateSessionExpiry(sessionId, newExpiry)

    req.user = session.data.username
    next()
}

async function logMiddleware(req, res, next) {
    await business.logAccess(req.user, req.url, req.method)
    next()
}

/**
 * Displays a list of all employees.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
app.get('/', authMiddleware, async (req, res) => {

    let employees = await business.allEmployees()

    let result = '<h1>List of Employees</h1>'
    result += '<ul>'

    for (let e of employees) {
        result += '<li>'
        result += "<a href='/employee/" + e._id + "'>"
        result += e.name
        result += "</a>"
        result += "</li>"
    }
    
    result += "</ul>"
    res.send(result)
})

app.get('/login', (req, res) => {

    let message = req.query.msg || ''
    let result = '<h1>Login</h1>'

    if (message) {
        result += "<p style='color:red'>" + message + "</p>"
    }

    result += `
        <form method="POST" action="/login">
            Username: <input name="username"><br>
            Password: <input type="password" name="password"><br>
            <button type="submit">Login</button>
        </form>
        `
    
    res.send(result) 
})

app.post('/login', async (req, res) => {

    let username = req.body.username
    let password = req.body.password

    let session = await business.attemptLogin(username, password)

    if (!session) {
        return res.redirect('/login?msg=Invalid username or password')
    }

    res.cookie('sessionId', session.key)

    res.redirect('/') 
})

app.use(authMiddleware)
app.use(logMiddleware)

/**
 * Shows details and shifts of a specific employee.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
app.get('/employee/:id', authMiddleware, async (req, res) => {

    let id = req.params.id
    let schedule = await business.getEmployeeSchedule(id)

    if (schedule.message && schedule.message.length > 0) {
        return res.send(schedule.message)
    }

    let employees = await business.allEmployees()
    let employee = null

    for (let e of employees) {
        if (String(e._id) === id) {
            employee = e
        }
    }

    let result = '<h1>Employee Details</h1>'

    result += '<p>Name: ' + employee.name + '</p>'
    result += '<p>Phone: ' + employee.phone + '</p>'
    result += "<a href='/edit/" + employee._id + "'>Edit Details</a>"
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
app.get('/edit/:id', authMiddleware, async (req, res) => {

    let id = req.params.id
    let employees = await business.allEmployees()
    let employee = null

    for (let e of employees) {
        if (String(e._id) === id) {
            employee = e
        }
    }

    if (!employee) {
        return res.send("Employee not found")
    }

    let result = '<h1>Edit</h1>'
    result += "<form method='POST' action='/edit/" + employee._id + "'>"
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
app.post('/edit/:id', authMiddleware, async (req, res) => {

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

    const {ObjectId} = require('mongodb')
    const db = await require('./persistence.js').connectDatabase()

    await db.collection('employees').updateOne(
        {_id: new ObjectId(id)},
        {$set: {name, phone}}
    )

    res.redirect('/')
})

app.get('/logout', async (req, res) => {
    let sessionId = req.cookies.sessionId
    
    await persistence.deleteSession(sessionId)

    res.clearCookie('sessionId')
    res.redirect('/login?msg=Logged out')
})

/**
 * Starts the Express server on port 8000.
 */
app.listen(8000, () => {
    console.log("Server running on http://127.0.0.1:8000")
})