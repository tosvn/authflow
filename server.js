const express = require('express')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const authRoutes = require('./routes/auth.routes')

dotenv.config()

const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static('public')) //Serves the HTML frontend

//Routes
app.use('/api/auth', authRoutes)  

// DB + Server
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected')
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`)
        })
    })
    .catch((err) => console.error('DB connection error:', err))