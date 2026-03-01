const persistence = require('./persistence')

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
 * Validates ID format
 * @param {string} id
 * @param {string} prefix
 * @returns {boolean}
 */
function isValidIdFormat(id, prefix) {
    if (typeof id !== 'string') {
        return false
    }
    if (id.length !== 4) {
        return false
    }
    if (id.substring(0, 1) !== prefix) {
        return false
    }

    let digits = id.substring(1)
    let num = Number(digits)
    if (Number.isNaN(num)) {
        return false
    }

    return digits === String(num).padStart(3, '0')
}

/**
 * Returns next valid employee ID based on existing latest ID
 * @param {string} id
 * @param {string} prefix
 * @returns {boolean}
 */
function getNextEmployeeId(employees){
    let max = 0

    for(let e of employees){
        let num = Number(e.employeeId.substring(1))
        if (!Number.isNaN(num) && num > max){
            max = num
        }
    }

    return 'E' + String(max + 1).padStart(3,'0')
}

/**
 * Adds new employee to system after validating input
 * @param {string} name
 * @param {string} phone
 * @returns {Promise<string>}
 */
async function addEmployee(name, phone) {
    if (isBlank(name)) {
        return 'Name entered is invalid'
    }
    name = name.trim()

    if (name.length > 20) {
        return 'Name too long (max 20 characters)'
    }

    if (isBlank(phone)) {
        return 'Phone number entered is invalid'
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
 * Validates whether an employee ID exists and has right format.
 * @param {string} employeeId
 * @returns {Promise<string>}
 */
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
    let employeeVal = await validateEmployee(employeeId)
    if (employeeVal.length > 0) {
        return { message: employeeVal, records: []}
    }

    employeeId = employeeId.trim()

    let records = await persistence.findShiftsByEmployee(employeeId)
    sortShifts(records)
    
    return { message: '', records: records }
}

module.exports = {
    allEmployees,
    addEmployee,
    getEmployeeSchedule,
    computeShiftDuration
}