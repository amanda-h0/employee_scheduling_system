const fs = require('fs/promises')

/**
 * Reads employee data from employees.json.
 * @returns {Promise<Array>}
 */
async function loadEmployees() {
    const data = await fs.readFile('employees.json', 'utf-8')
    return JSON.parse(data)
}

/**
 * Writes the employee list back to employees.json.
 * @param {Array} employees
 * @returns {Promise<void>}
 */
async function saveEmployees(employees) {
    await fs.writeFile('employees.json', JSON.stringify(employees, null, 2)
    )
}

/**
 * Reads shift data from shifts.json.
 * @returns {Promise<Array>}
 */
async function loadShifts() {
    const data = await fs.readFile('shifts.json', 'utf-8')
    return JSON.parse(data)
}

/**
 * Reads assignment records from assignments.json.
 * @returns {Promise<Array>}
 */
async function loadAssignments() {
    const data = await fs.readFile('assignments.json', 'utf-8')
    return JSON.parse(data)
}

/**
 * Saves assignment records to assignments.json.
 * @param {Array<Object>} assignments
 * @returns {Promise<void>}
 */
async function saveAssignments(assignments) {
    await fs.writeFile('assignments.json', JSON.stringify(assignments, null, 2)
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

/**
 * Finds an employee by their ID.
 * @param {string} employeeId
 * @returns {Promise<Object|undefined>}
 */
async function findEmployee(employeeId) {
    const employees = await loadEmployees()

    for (let e of employees) {
        if (e.employeeId === employeeId) {
            return e
        }
    }

    return undefined
}

/**
 * Finds a shift by its ID.
 * @param {string} shiftId
 * @returns {Promise<Object|undefined>}
 */
async function findShift(shiftId) {
    const shifts = await loadShifts()

    for (let s of shifts) {
        if (s.shiftId === shiftId) {
            return s
        }
    }

    return undefined
}

/**
 * Adds a new employee record.
 * @param {Object} employee
 * @returns {Promise<void>}
 */
async function addEmployee(employee) {
    const employees = await loadEmployees()
    employees.push(employee)
    await saveEmployees(employees)
}


/**
 * Returns all shifts assigned to an employee.
 * @param {string} employeeId
 * @returns {Promise<Array<Object>>}
 */
async function findShiftsByEmployee(employeeId) {
    let assignments = await loadAssignments()
    let shifts = await loadShifts()
    let result = []

    let employeeShiftIds = []
    for (let a of assignments) {
        if (a.employeeId === employeeId) {
            employeeShiftIds.push(a.shiftId)
        }
    }

    for (let id of employeeShiftIds) {
        for (let s of shifts) {
            if (s.shiftId === id) {
                result.push({
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime
                })
            }
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
    let assignments = await loadAssignments()
    let shifts = await loadShifts()
    let result = []

    let employeeShiftIds = []
    for (let a of assignments) {
        if (a.employeeId === employeeId) {
            employeeShiftIds.push(a.shiftId)
        }
    }

    for (let id of employeeShiftIds) {
        for (let s of shifts) {
            if (s.shiftId === id && s.date === date) {
                result.push({
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime
                })
            }
        }
    }

    return result
}

module.exports = {
    loadEmployees,
    loadConfig,
    findEmployee,
    findShift,
    addEmployee,
    findShiftsByEmployee,
    findShiftsByEmployeeAndDate
}
