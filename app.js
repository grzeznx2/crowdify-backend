const express = require('express')
const cors = require('cors')
// const stripe = require('stripe')('sk_test_51H28UsFaKpmcHFtR9xcSX30bTHsga3MBIhTrEJTqopcGqCQ92SHMBy7JdavYgvMGCdJQxxMrlcZErTWjfX2L6pko00kSDRdfPt')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/globalErrorHandler')

const projectRouter = require('./routes/projectRoutes')
const userRouter = require('./routes/userRoutes')
const commentRouter = require('./routes/commentRoutes')
const rateRouter = require('./routes/rateRoutes')
const transactionRouter = require('./routes/transactionRoutes')
const investmentRouter = require('./routes/investmentRoutes')

const app = express()

app.use(express.json())
app.use(cors())
app.use(cookieParser())

app.use('/api/v1/projects', projectRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/rates', rateRouter)
app.use('/api/v1/transactions', transactionRouter)
app.use('/api/v1/investments', investmentRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server :(`, 404))
})

app.use(globalErrorHandler)

module.exports = app
