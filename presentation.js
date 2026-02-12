
const prompt = require('prompt-sync')()
const business = require('./business')

async function listEmployees() {
    let employees = await business.allEmployees()

if (employees.length === 0){
        console.log('No employees recorded.')
    }
    else {
        let maxNameLen = 0

        for (let i = 0; i < employees.length; i++){
            if (employees[i].name.length > maxNameLen){
                maxNameLen = employees[i].name.length
            }
        }

        console.log('Employee ID  Name' + ' '.repeat(maxNameLen - 4) + "  Phone")
        console.log('-----------  ' + '-'.repeat(maxNameLen) + '  -----------')

        for (let i = 0; i < employees.length; i++) {
            let employeeId = employees[i].employeeId
            let name = employees[i].name
            let phone = employees[i].phone

            let spaceAfterName = maxNameLen - name.length

            console.log(employeeId + '         ' + name + ' '.repeat(spaceAfterName + 1) + ' ' + phone)
        }
    }
}

async function addEmployee() {
    let name = prompt('Enter new employee name: ')
    let phone = prompt('Enter new employee phone number: ')

    let result = await business.addEmployee(name,phone)
    console.log(result)
}


async function assignShift(){
    let employeeId = prompt('Enter employee ID: ')
    let shiftId = prompt('Enter shift ID: ')

    let result = await business.assignShift(employeeId,shiftId)
    console.log(result)
}

async function viewEmployeeSchedule() {
    let employeeId = prompt('Enter employee ID: ')

    let result = await business.getEmployeeSchedule(employeeId)

    if (result.message.length > 0){
        console.log(result.message)
        return
    } else if (result.records.length === 0){
        console.log('No shifts found.')
        return
    }

    console.log('date,startTime,endTime')
    for(let r of result.records){
        console.log(r.date+','+r.startTime+','+r.endTime)
    }
}

async function display(){
    while(true){
        console.log('')
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let choice = Number(prompt('What is your choice> '))

        if (choice == 1){
            // Show all employees
            await listEmployees()
        }
        else if (choice == 2){
            // Add new employee
            await addEmployee()
        }
        else if (choice == 3){
            // Assign employee to shift
            await assignShift()
        }
        else if (choice == 4){
            // View employee schedule
            await viewEmployeeSchedule()
        }
        else if (choice == 5){
            break
        }
        else {
            console.log('ERROR!!! Pick a number between 1 & 5.')
        }
    }
}

display()