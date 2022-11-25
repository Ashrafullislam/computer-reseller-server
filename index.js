const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000 ;
require('dotenv').config()

// middleware  
app.use(cors())
app.use(express.json())


// root 
app.get('/', (req,res) => {
    res.send('computer reseller server running ')
})



// Mongodb  section start here 
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rhjlmgh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async() => {
 try{
  const categoryOptionCollection = client.db('computerResell').collection('category')
   // get all category otion with products info 
   app.get('/categories', async(req,res) => {
    const query = {}
    const category = await categoryOptionCollection.find(query).toArray()
    res.send(category)
   })
 }
 finally{
   
 }
}
run().catch(console.dir)


// listener use for see server running in console 
app.listen(port, ()=> {
    console.log(`computer reseller server running on ${port}`)
})

