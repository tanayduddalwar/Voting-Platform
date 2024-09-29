const mongoose=require("mongoose");
require("dotenv").config();

//define the mongodb connection url
//const mongourl=process.env.MONGODB_URL;
const mongoUrl = process.env.MONGODB_URL_LOCAL
//set up mongodb connection
mongoose.connect(mongoUrl,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

const db=mongoose.connection;

db.on("connected",()=>{
    console.log("Connected to mongodb server");
});
db.on("error",(err)=>{
    console.log("Mongodb connection error");
})
db.on("disconnected",(err)=>{
    console.log("Mongodb connection disconnected");
})




