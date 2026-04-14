const { MongoClient } = require('mongodb')

let client = new MongoClient('mongodb+srv://60306436:12class34@cluster0.kquxkkg.mongodb.net/')

/**
 * Main function to execute database transformation steps.
 * @returns {Promise<void>}
 */
async function run() {
    await client.connect()
    let db = client.db('infs3201_winter2026')

    await addEmployeesArray(db)
    await embedEmployees(db)
    await cleanup(db)

    console.log("DONE")
    process.exit()
}

/**
 * Adds an empty employees array to all shift documents.
 * @param {import('mongodb').Db} db
 * @returns {Promise<void>}
 */
async function addEmployeesArray(db) {
    await db.collection('shifts').updateMany(
        {},
        {$set: {employees: []}}
    )
}

/**
 * Embeds employee ObjectIds into corresponding shift documents.
 * @param {import('mongodb').Db} db
 * @returns {Promise<void>}
 */
async function embedEmployees(db) {

    let assignments = await db.collection('assignments').find().toArray()

    for (let a of assignments) {

        let emp = await db.collection('employees').findOne({ employeeId: a.employeeId })
        let shift = await db.collection('shifts').findOne({ shiftId: a.shiftId })

        if (emp && shift) {
            await db.collection('shifts').updateOne(
                { _id: shift._id },
                { $push: { employees: emp._id } }
            )
        }
    }
}

/**
 * Removes old fields and drops the assignments collection.
 * @param {import('mongodb').Db} db
 * @returns {Promise<void>}
 */
async function cleanup(db) {

    await db.collection('employees').updateMany(
        {},
        { $unset: { employeeId: "" } }
    )

    await db.collection('shifts').updateMany(
        {},
        { $unset: { shiftId: "" } }
    )

    await db.collection('assignments').drop()
}

run()