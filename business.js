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

module.exports = {
    allEmployees,
    addEmployee,
    getEmployeeSchedule,
    computeShiftDuration
}