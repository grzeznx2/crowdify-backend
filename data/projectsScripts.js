const dotenv = require('dotenv')
const mongoose = require('mongoose')

const projects = require('./projects')
const Project = require('../models/projectModel')

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

const importData = async () => {
    try {
        await Project.create(projects)
        console.log('Data succesfully loaded!')
    } catch (error) {
        console.log(error)
    }
    process.exit()
}

const deleteData = async () => {
    try {
        await Project.deleteMany()
        console.log('Data succesfully deleted!')
    } catch (error) {
        console.log(error)
    }
    process.exit()
}

if (process.argv[2] === '--import') importData()
if (process.argv[2] === '--delete') deleteData()







