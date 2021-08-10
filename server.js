const dotenv = require('dotenv')
const mongoose = require('mongoose')

const app = require('./app')

dotenv.config({ path: './config.env' })

const DATABASE = process.env.DATABASE

mongoose
    .connect(DATABASE, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    }).then(() => {
        console.log("DB connection succesfull!!");
    })

app.listen(process.env.PORT, () => {
    console.log(`Listening to port ${process.env.PORT}...`)
})