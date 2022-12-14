const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000 ;
require('dotenv').config();
const { query } = require('express');

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
// console.log(uri)
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
  const reportCollection = client.db('computerResell').collection('reports')


// ----------- get all category otion with products info --------------/
   app.get('/categories', async(req,res) => {
    const query = {}
    const category = await categoryOptionCollection.find(query).toArray()
    res.send(category)
   })
   
// ------------ get products by products category start here  ---------------//
   app.post('/products', async(req,res)=> {
    const data = req.body;
     const sendProductsDb = await productsCollection.insertOne(data);
     res.send(sendProductsDb); 
   })
   // get products under the category 
   app.get('/categoryProducts/:id', async(req,res) => {
    const id = req.params.id;
    const query = {category_id:id}
    const categoryProducts = await productsCollection.find(query).toArray()
    res.send(categoryProducts)

   })

   // ------------ get products by products category end  here  ---------------//


  


// ------------user verify and save user and get user---------------//
   // if user? db? , get user information by jwt from db 
   app.get('/jwt', async(req,res)=> {
    const email = req.query.email;
    const query = {email:email};
    const user = await usersCollection.findOne(query);
    // if get user , give a token 
    if(user){
        const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'2h'})
        return res.send({accessToken:token})
    }
    // if user not found from db send the status 
    res.status(403).send({accessToken:'Not found '})
   })
// ------------user verify and save user and get user---------------//


// report post data in database and get report from database //
// post repots  data in db

app.post('/reports', async(req,res)=>{
    const report = req.body
    console.log(report);
    const result = await reportCollection.insertOne(report)
    res.send(result)
})
  //get users data from mongodb
  app.get('/reports', async (req,res)=>{
    const query = {};
    const cursor = reportCollection.find(query)
    const reports = await cursor.toArray()
    res.send(reports)
})

// delete report from client side and databse //
app.put('/reports/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id:ObjectId(id)};
    const deleteReport = await reportCollection.deleteOne(query);
    res.send(deleteReport);

})


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




 //=========user make admin  collection and dashboard  start here ============//
    // check usertype :if userType === seller ? he will able to adde a products 
    app.get('/users/seller/:email', async(req,res)=> {
        const email = req.params.email;
        const query = {email}
        // const decodedEmail = req.decoded.email;
        // const query = {email:decodedEmail};
        const user = await usersCollection.findOne(query);
        // if(user?.userType !== "seller"){
        //     return res.status(403).send({message:'forbidden access'})
        // }
        res.send({isSeller:user?.role  })
    })
   

 

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

 // =========user verify by admin > ===========
 app.put('/users/verify/:id',verifyJWT, async(req,res)=> {
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
            verify:'verified'
        },
    };
    const result = await usersCollection.updateOne(filter,updateDoc,options);
    res.send(result)
 })


    // delete user from database  
    app.put('/users/:email', async(req,res)=> {
        const email = req.params.email;
        const query = {email:email};
        const deleteUser = await usersCollection.deleteOne(query);
        res.send(deleteUser)
       })

    //=========== dashboard part end here ================//






  
 //=========user booking collection start here ============

   // find data from client side and savedata in databse 
   app.post('/bookings', async(req,res) => {
    const bookingReq = req.body ;
    const booking = await bookingCollection.insertOne(bookingReq)
    res.send(booking)
   })
   
   // delete a specific order by id 
   app.put('/booking/:id', async(req,res)=> {
    const id = req.params.id;
    const query = {_id:ObjectId(id)};
    const deleteOrder = await bookingCollection.deleteOne(query);
    res.send(deleteOrder)
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

