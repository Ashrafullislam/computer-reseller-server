const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000 ;
require('dotenv').config();

// require for json web token
const jwt = require('jsonwebtoken');

// middleware  
app.use(cors())
app.use(express.json())


// root 
app.get('/', (req,res) => {
    res.send('computer reseller server running ')
})


//------------------ Mongodb  section start here --------------------//
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rhjlmgh.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// -------------------verify specific user by jwt token ---------------//
// verify user token 
function verifyJWT(req,res,next) {
    const authHeader = req.headers.authorization ;
    if(!authHeader){
         return  res.send(401).send('unauthorized access')

    }
    const token = authHeader.split(' ')[1]
    // jwt verify  call for verify client req token 
    console.log('token find ',token)
    jwt.verify(token, process.env.ACCESS_TOKEN , function(err , decoded) {
        // if an error occurd , then send the 403 status 
        if(err) {
            return res.status(403).send({message:'forbidden access'})
        }
        //  if not an error occurd doing work 
        req.decoded = decoded ;

        // next must be call for going to next step after verify 
        next();
        
    })
}



const run = async() => {
 try{

// +++++++++++++++++++++++++ all  collections of database +++++++++++++++++ / 
  const categoryOptionCollection = client.db('computerResell').collection('category')
  const productsCollection = client.db('computerResell').collection('categoryProducts');
  const usersCollection = client.db('computerResell').collection('users')
  const bookingCollection = client.db('computerResell').collection('bookings')


// ----------- get all category otion with products info --------------/
   app.get('/categories', async(req,res) => {
    const query = {}
    const category = await categoryOptionCollection.find(query).toArray()
    res.send(category)
   })
   
// ------------ get products by products category start here  ---------------//

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
    const productDetails = await  productsCollection.findone(query).toArray()
    res.send(productDetails)

   } )

 // ------------ get products by products category start here  ---------------//




// ------------user verify and save user and get user---------------//
   // if user? db? , get user information by jwt from db 
   app.get('/jwt', async(req,res)=> {
    const email = req.query.email;
    const query = {email:email};
    const user = await usersCollection.findOne(query);
    // if get user , give a token 
    if(user){
        const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'4h'})
        return res.send({accessToken:token})
    }
    // if user not found from db send the status 
    res.status(403).send({accessToken:'Not found '})
   })
// ------------user verify and save user and get user---------------//





//=========user info save database and get user part start here ============
   // get users info from database 
   app.get('/users', async(req,res) => {
    const query = {};
    const users = await usersCollection.find(query).toArray()
    res.send(users)
   })


   // save user info in database 
   app.post('/users', async(req,res)=> {
    const userReq = req.body ;
    const user = await usersCollection.insertOne(userReq);
    res.send(user)
   })
//=========user info save database and get user part end here ============




 //=========user make admin  collection start here ============//

   // check user isAdmin ,if user.role not admin ? .. he will not access go to admin dashbord url
   app.get('/users/admin/:email', async(req,res)=> {
    const email = req.params.email;
    const query = {email}
    const user = await usersCollection.findOne(query);
    res.send({isAdmin: user?.role === "admin"})
   } )

 // update user by specific id and make admin  .....
 app.put('/users/admin/:id',verifyJWT, async(req,res)=> {
    // load user from db and check role admin have or haven't
    const decodedEmail = req.decoded.email;
    const query = {email:decodedEmail};
    const user = await usersCollection.findOne(query);
    if(user.role !== "admin" ){
        return res.status(403).send({message:'forbidden access '})
    } 
    const id = req.params.id ;
    const filter = {_id:ObjectId(id)};
    const options = {upsert:true};
    const updateDoc = {
        $set:{
            role:'admin'
        },
    };
    const result = await usersCollection.updateOne(filter,updateDoc,options);
    res.send(result)
 })


  
 //=========user booking collection start here ============

   // find data from client side and savedata in databse 
   app.post('/bookings', async(req,res) => {
    const bookingReq = req.body ;
    const booking = await bookingCollection.insertOne(bookingReq)
    res.send(booking)
   })
   

   // get my orders by user email 
   app.get('/bookings',verifyJWT, async(req,res) => {
    const email = req.query.email;
    const decodedEmail = req.decoded.email;
    console.log(email,decodedEmail)
    if(email !== decodedEmail){
        return res.status(403).send({message:'forbidden access'})
    }
    const query = {email:email};
    const myOrders = await bookingCollection.find(query).toArray();
    res.send(myOrders)
   })
 
 //=========user booking collection end here ============




 }
 finally{
   
 }
}
run().catch(console.dir)


// listener use for see server running in console 
app.listen(port, ()=> {
    console.log(`computer reseller server running on ${port}`)
})

