function sendEmail(to, subject, message) {
    console.log("------ EMAIL ------")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("Message:", message)
    console.log("-------------------")
}

module.exports = { sendEmail }