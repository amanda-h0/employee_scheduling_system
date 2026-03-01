const fs = require('fs/promises')
const { MongoClient } = require('mongodb')

let client = undefined

/**
 * Connects to MongoDB and returns the database object.
 * @returns {Promise<Db>}
 */
async function connectDatabase() {
    if (!client){
        client = new MongoClient('mongodb+srv://60306436:12class34@cluster0.xubu2x5.mongodb.net/')
        await client.connect()
    }
    return client.db('infs3201_winter2026')
}

/**
 * Returns all employees.
 * @returns {Promise<Array>}
 */
async function loadEmployees() {
    const db = await connectDatabase()
    return db.collection('employees').find({}).toArray()
}

/**
 * Adds a new employee record.
 * @param {Object} employee
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    const db = await connectDatabase()
    await db.collection('employees').insertOne(employee)
}

/**
 * Finds an employee by their ID.
 * @param {string} employeeId
 * @returns {Promise<Object|undefined>}
 */
async function findEmployee(employeeId) {
    const db = await connectDatabase()
    return db.collection('employees').findOne({employeeId})
}

/**
 * Returns shifts data.
 * @returns {Promise<Array>}
 */
async function loadShifts() {
    const db = await connectDatabase()
    return db.collection('shifts').find({}).toArray()
}

/**
 * Finds a shift by its ID.
 * @param {string} shiftId
 * @returns {Promise<Object|undefined>}
 */
async function findShift(shiftId) {
    const db = await connectDatabase()
    return db.collection('shifts').findOne({shiftId})
}

/**
 * Returns all shifts assigned to an employee.
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
async function findShiftsByEmployee(employeeId) {
    const db = await connectDatabase()
    let assignments = await db.collection('assignments').find({employeeId}).toArray()

    let shiftIds = []
    for (let a of assignments) {
        shiftIds.push(a.shiftId)
    }
    
    let result = []

    for (let a of assignments) { 
        let shift = await db.collection('shifts').findOne({shiftId : a.shiftId})
        if (shift) {
            result.push({
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime
            })
        }
    }
    return result
}

/**
 * Returns all shifts assigned to an employee on a specific date.
 * @param {string} employeeId
 * @param {string} date
 * @returns {Promise<Array>}
 */
async function findShiftsByEmployeeAndDate(employeeId, date) {
    const db = await connectDatabase()
    let assignments = await db.collection('assignments').find({employeeId}).toArray()

    let shiftIds = []
    for (let a of assignments) {
        shiftIds.push(a.shiftId)
    }

    let result = []
    for (let s of shiftIds) {
        let shift = await db.collection('shifts').findOne({shiftId : s, date})
        if (shift) {
            result.push({
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime
            })
        }
    }
    return result
}

/**
 * Loads system configuration from config.json.
 * @returns {Promise<Object>}
 */
async function loadConfig() {
    const data = await fs.readFile('config.json', 'utf-8')
    return JSON.parse(data)
}

module.exports = {
    connectDatabase,
    loadEmployees,
    addEmployee,
    findEmployee,
    loadShifts,
    findShift,
    findShiftsByEmployee,
    findShiftsByEmployeeAndDate,
    loadConfig
}