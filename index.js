const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
  const productsCollection = client.db('computerResell').collection('categoryProducts')
   // get all category otion with products info 
   app.get('/categories', async(req,res) => {
    const query = {}
    const category = await categoryOptionCollection.find(query).toArray()
    res.send(category)
   })
   
   // get products under the category 
   app.get('/categoryProducts/:id', async(req,res) => {
    const id = req.params.id;
    const query = {category_id:id}
    const categoryProducts = await productsCollection.find(query).toArray()
    res.send(categoryProducts)

   })

   // get specific products details by id 
   app.get('/productDetails/:id', async(req,res) => {
    const id = req.params.id ;
    const query = {_id:ObjectId(id)}
    const productDetails = await  productsCollection.find(query).toArray()
    res.send(productDetails)

   } )

 }
 finally{
   
 }
}
run().catch(console.dir)


// listener use for see server running in console 
app.listen(port, ()=> {
    console.log(`computer reseller server running on ${port}`)
})

