const fs = require('fs/promises')
const {MongoClient, ObjectId} = require('mongodb')

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

// let { MongoClient, ObjectId } = require('mongodb')

/**
 * Finds an employee by their Object ID in mongo.
 * @param {string} employeeId
 * @returns {Promise<Object|undefined>}
 */
async function findEmployee(employeeId) {
    const db = await connectDatabase()
    return db.collection('employees').findOne({_id: new ObjectId(employeeId)})
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
    return db.collection('shifts').findOne({_id: new ObjectId(shiftId)})
}

async function findShiftsByEmployee(employeeId) {
    const db = await connectDatabase()

    return db.collection('shifts').find({employees: new ObjectId(employeeId)}).toArray()
}

async function getUserDetails(username) {
    const db = await connectDatabase()

    return db.collection('users').findOne({username})
}

async function startSession(sessionData) {
    const db = await connectDatabase()

    await db.collection('sessions').insertOne(sessionData)
}

async function getSession(sessionId) {
    const db = await connectDatabase()

    return db.collection('sessions').find({key:sessionId})
}

async function deleteSession(sessionId) {
    const db = await connectDatabase()

    await db.collection('sessions').deleteOne(sessionData)
}

async function updateSessionExpiry(sessionId, newExpiry) {
    const db = await connectDatabase()

    await db.collection('sessions').updateOne(
        {key:sessionId},
        {$set: {expiry: newExpiry}}
    )
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
    getUserDetails,
    startSession,
    getSession,
    deleteSession,
    updateSessionExpiry,
    loadConfig
}