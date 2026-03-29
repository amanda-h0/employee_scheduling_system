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

/**
 * Finds all shifts assigned to a specific employee.
 * @param {string} employeeId - Employee ObjectId as string
 * @returns {Promise<Array>} Array of shift objects
 */
async function findShiftsByEmployee(employeeId) {
    const db = await connectDatabase()

    return db.collection('shifts').find({employees: new ObjectId(employeeId)}).toArray()
}

/**
 * Retrieves user login details by username.
 * @param {string} username
 * @returns {Promise<Object|undefined>} User document or undefined if not found
 */
async function getUserDetails(username) {
    const db = await connectDatabase()

    return db.collection('users').findOne({username})
}

/**
 * Stores a new session in the database.
 * @param {Object} sessionData - Session object containing key, expiry, and user data
 * @returns {Promise<void>}
 */
async function startSession(sessionData) {
    const db = await connectDatabase()

    await db.collection('sessions').insertOne(sessionData)
}

/**
 * Retrieves a session by its session key.
 * @param {string} sessionId
 * @returns {Promise<Object|undefined>} Session object or undefined if not found
 */
async function getSession(sessionId) {
    const db = await connectDatabase()

    return db.collection('sessions').findOne({key:sessionId})
}

/**
 * Deletes a session from the database.
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
    const db = await connectDatabase()

    await db.collection('sessions').deleteOne({key:sessionId})
}

/**
 * Updates the expiry time of an existing session.
 * @param {string} sessionId
 * @param {Date} newExpiry - New expiry timestamp
 * @returns {Promise<void>}
 */
async function updateSessionExpiry(sessionId, newExpiry) {
    const db = await connectDatabase()

    await db.collection('sessions').updateOne(
        {key:sessionId},
        {$set: {expiry: newExpiry}}
    )
}

/**
 * Adds a log entry to the security log collection.
 * @param {Object} log - Log object containing timestamp, username, url, and method
 * @returns {Promise<void>}
 */
async function addLog(log) {
    const db = await connectDatabase()
    await db.collection('security_log').insertOne(log)
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
    addLog,
    loadConfig
}