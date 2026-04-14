const persistence = require('./persistence')
const crypto = require('crypto')
const { sendEmail } = require('./emailSystem')

/**
 * Returns all employees.
 * @returns {Promise<Array>}
 */
async function allEmployees(){
    return await persistence.loadEmployees()
}

/**
 * Checks whether a string value is null, undefined, or empty after trimming.
 * @param {string} val
 * @returns {boolean}
 */
function isBlank(val){
    return val === null || val === undefined || val.trim().length === 0
}

/**
 * Adds a new employee after validating input fields.
 * @param {string} name - Employee name
 * @param {string} phone - Employee phone number
 * @returns {Promise<string>} Result message indicating success or validation error
 */
async function addEmployee(name, phone) {
    if (isBlank(name)) {
        return 'Enter valid name.'
    }

    if (isBlank(phone)) {
        return 'Enter valid phone number.'
    }

    await persistence.addEmployee({
        name,
        phone
    })

    return 'Employee added!'
}

/**
 * Computes the duration of a work shift in hours as a real number.
 *
 * @function computeShiftDuration
 * @param {string} startTime - The start time in "HH:MM" format (24-hour clock).
 * @param {string} endTime - The end time in "HH:MM" format (24-hour clock).
 * @returns {number} The duration of the shift in hours as a real number.
 *
 * @LLM Microsoft Copilot
 * @Prompt "Generate a JavaScript function computeShiftDuration(startTime, endTime) 
 *          which calculates how many hours (as a real number) are between the 
 *          startTime and endTime. For example, if a shift starts at 11:00 and ends 
 *          at 13:30 then the number of hours is 2.5."
 */
function computeShiftDuration(startTime, endTime) {
  // Parse start time
  let startParts = startTime.split(":");
  let startHour = Number(startParts[0]);
  let startMinute = Number(startParts[1]);  
  const startTotalMinutes = startHour * 60 + startMinute;

  // Parse end time
  let endParts = endTime.split(":");
  let endHour = Number(endParts[0]);
  let endMinute = Number(endParts[1]);
  const endTotalMinutes = endHour * 60 + endMinute;

  // Calculate duration in minutes
  let durationMinutes = endTotalMinutes - startTotalMinutes;

  // Handle overnight shifts (end time past midnight)
  if (durationMinutes < 0) {
    durationMinutes += 24 * 60;
  }

  // Convert minutes to hours
  return durationMinutes / 60;
}


/**
 * Compares two shift records by date and start time.
 * @param {Object} a
 * @param {Object} b
 * @returns {number} 
 */
function compareShifts(a, b) {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    if (a.startTime < b.startTime) return -1
    if (a.startTime > b.startTime) return 1
    return 0
}

/**
 * Sorts shifts in ascending order by date and start time using the bubble sort algorithm.
 * @param {Array<Object>} records
 * @returns {void}
 */
function sortShifts(records) {
    let n = records.length
    for (let i = 0; i < n - 1; i++) {
        let swapped = false
        for (let j = 0; j < n - 1 - i; j++) {
            if (compareShifts(records[j], records[j + 1]) > 0) {
                let temp = records[j]
                records[j] = records[j + 1]
                records[j + 1] = temp
                swapped = true
            }
        }
        if (!swapped) return
    }
}

/**
 * Validates input then returns employee's schedule.
 * @param {string} employeeId
 * @returns {Promise<Object>}
 */
async function getEmployeeSchedule(employeeId) {
    let shifts = await persistence.findShiftsByEmployee(employeeId)
    let records = []

    for (let s of shifts) {
        records.push({
            date: s.date,
            startTime: s.startTime,
            endTime: s.endTime
        })
    }

    sortShifts(records)

    return {message: '', records}
}

/**
 * Attempts to authenticate a user and create a session.
 * @param {string} username - The username entered
 * @param {string} password - The plain text password entered
 * @returns {Promise<Object|undefined>} Session object if successful, otherwise undefined
 */
async function attemptLogin(username, password) {
    let details = await persistence.getUserDetails(username)

    if (!details) {
        return { success: false }
    }

    if (details.isLocked) {
        return { success: false, message: "Account locked" }
    }

    // hash password
    let hasher = crypto.createHash('sha256')
    hasher.update(password)
    let hashedPass = hasher.digest('hex')

    // WRONG PASSWORD
    if (details.password !== hashedPass) {

        let attempts = (details.failedAttempts || 0) + 1

        let updates = { failedAttempts: attempts }

        // send warning email after 3 failed attempts
        if (attempts === 3) {
            sendEmail(details.username, "Suspicious Activity", "3 failed login attempts detected.")
        }

        // lock account after 10 failed attempts
        if (attempts >= 10) {
            updates.isLocked = true
        }

        await persistence.updateUser(username, updates)

        return { success: false }
    }

    // CORRECT PASSWORD >>> GENERATE 2FA

    let code = Math.floor(100000 + Math.random() * 900000).toString()

    let expiry = new Date(Date.now() + 1000 * 60 * 3) // 3 mins

    await persistence.updateUser(username, {
        failedAttempts: 0,
        twoFACode: code,
        twoFAExpiry: expiry
    })

    sendEmail(details.username, "Your 2FA Code", "Code: " + code)

    return {
        success: true,
        require2FA: true,
        username: details.username
    }
}

/**
 * Logs a user's access attempt including request details.
 * @param {string} username - Username of the requester (or guest)
 * @param {string} url - Requested URL
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @returns {Promise<void>}
 */
async function logAccess(username, url, method) {
    await persistence.addLog({
        timestamp: new Date(),
        username: username || "guest",
        url,
        method
    })
}

/**
 * Verifies a 2FA code and creates a session if valid.
 *
 * Checks:
 * - User exists
 * - Code is not expired
 * - Code matches stored value
 *
 * If valid, creates a session and returns it.
 *
 * @param {string} username - Username of the user
 * @param {string} code - 6-digit 2FA code entered by user
 * @returns {Promise<Object>} Result object with success flag and session data
 */
async function verify2FA(username, code) {
    let user = await persistence.getUserDetails(username)

    if (!user) return null

    if (new Date() > new Date(user.twoFAExpiry)) {
        return { success: false, message: "Code expired" }
    }

    if (user.twoFACode !== code) {
        return { success: false, message: "Invalid code" }
    }

    // create session
    let sessionKey = crypto.randomUUID()

    let sessionData = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000 * 60 * 5),
        data: {
            username: user.username
        }
    }

    await persistence.startSession(sessionData)

    return { success: true, session: sessionData }
}

module.exports = {
    allEmployees,
    addEmployee,
    getEmployeeSchedule,
    computeShiftDuration,
    attemptLogin,
    logAccess,
    verify2FA
}