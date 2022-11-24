const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000 ;


// middle ware 
app.use(cors())
app.use(express.json())

// root 
app.get('/', (req,res) => {
    res.send('computer reseller server running ')
})
app.listen(port, ()=> {
    console.log(`computer reseller server running on ${port}`)
})