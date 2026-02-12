const persistence = require('./persistence')

/**
 * Returns all employees
 * @returns {Promise<Array>}
 */
async function allEmployees(){
    return await persistence.loadEmployees()
}

/**
 * Returns true if value format is blank.
 * @param {string} value
 * @returns {boolean}
 */
function isBlank(val){
    return val === null || value === undefined || value.trim().length === 0
}

function getNextEmployeeId(employees){
    let max = 0

    for(let e of employees){
        let num = Number(e.employeeId.substring(1))
        if (!Number.isNaN(num) && num > max){
            max = num
        }
    }

    return 'E' + String(max+1).padStart(3,'0')
}

async function addEmployee(name, phone) {
    if (isBlank(name)) {
        return 'Name entered is invalid'
    }
    name = name.trim()

    if (name.length > 20) {
        return 'Name too long (max 20 characters)'
    }

    if (isBlank(phone)) {
        return 'Phone number enteres id invalid'
    }
    phone = phone.trim()

    let employees = await persistence.loadEmployees()
    let id = getNextEmployeeId(employees)

    await persistence.addEmployee({
        employeeId: id,
        name: name,
        phone: phone
    })

    return 'Employee added!'
}

function shiftDuration(startTime, endTime) {
    let startParts = startTime.split(':')
    let endParts = endTime.split(':')

    let startMins = Number(startParts[0]) * 60 + Number(startParts[1])
    let endMins = Number(endParts[0]) * 60 + Number(endParts[1])

    return (endMins - startMins) / 60
}

async function isWithinDailyLimit(employeeId, shiftId) {
    let config = await persistence.loadConfig()
    let maxHours = config.maxDailyHours
    let existingShifts = await persistence.findShiftsByEmployeeAndDate(employeeId, shift.date)

    let totalHours = 0
    for (let s of existingShifts) {
        totalHours = totalHours + shiftDuration(s.startTime, s.endTime)
    }

    let newDuration = shiftDuration(shiftId.startTime, shiftId.endTime)

    if (totalHours + newDuration > maxHours) {
        return false
    }

    return true
}

async function validateEmployee(employeeId) {
    if (isBlank(employeeId)) {
        return 'Invalid employee ID'
    }

    employeeId = employeeId.trim()

    if (!isValidIdFormat(employeeId, 'E')) {
        return 'Invalid employee ID'
    }

    let employee = await persistence.findEmployee(employeeId)
    if (!employee) {
        return 'Employee does not exist'
    }

    return ''
}

async function validateShift(shiftId) {
    if (isBlank(shiftId)) {
        return 'Invalid shift ID'
    }

    shiftId = shiftId.trim()

    if (!isValidIdFormat(shiftId, 'S')) {
        return 'Invalid shift ID'
    }

    let shift = await persistence.findShift(shiftId)
    if (!shift) {
        return 'Shift does not exist'
    }

    return ''
}

async function checkDuplicateAssignment(employeeId, shiftId) {
    if (await persistence.assignment(employeeId, shiftId)) {
        return 'Employee already assigned to shift'
    }
    return ''
}

async function checkDailyLimit(employeeId, shiftId) {
    let shift = await persistence.findShift(shiftId)
    let allowed = await isWithinDailyLimit(employeeId, shift)
    if (!allowed) {
        return 'Cannot assign shift to employee: daily hour limit would be exceeded'
    }
    return ''
}

async function assignShift(employeeId, shiftId) {
    let empError = await validateEmployee(employeeId)
    if (empError.length > 0) {
        return empError
    }

    let shiftError = await validateShift(shiftId)
    if (shiftError.length > 0) {
        return shiftError
    }

    employeeId = employeeId.trim()
    shiftId = shiftId.trim()

    let dupError = await checkDuplicateAssignment(employeeId, shiftId)
    if (dupError.length > 0) {
        return dupError
    }

    let limitError = await checkDailyLimit(employeeId, shiftId)
    if (limitError.length > 0) {
        return limitError
    }

    await persistence.addAssignment(employeeId, shiftId)
    return 'Shift Recorded'
}

function compareShifts(a, b) {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1
    if (a.startTime < b.startTime) return -1
    if (a.startTime > b.startTime) return 1
    return 0
}

/**
 * Uses bubble-sort to sort shift records by date then startTime.
 * @param {Array} records
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
    let employeeVal = await validateEmployee(employeeId)
    if (employeeVal.length > 0) {
        return { message: employeeVal, records: [] }
    }

    employeeId = employeeId.trim()

    let records = await persistence.findShiftsByEmployee(employeeId)
    sortShiftRecords(records)

    return { message: '', records: records }
}

module.exports = {
    allEmployees,
    addEmployee,
    assignShift,
    getEmployeeSchedule,
    shiftDuration
}