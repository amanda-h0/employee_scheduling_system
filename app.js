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


app.listen(8000, () => {
    console.log("Server running on http://127.0.0.1:8000")
})