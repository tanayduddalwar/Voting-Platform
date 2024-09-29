const mongoose=require("mongoose");
const candidateschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    club:{
        type:String,
        required:true,
    },
    position:{
        type:String,
    },
    age:{
        type:Number,
        required:true,
    },
    votes:[
        {
            user:{
                type:mongoose.Schema.Types.ObjectId,
                required:true,
                ref:"usermodel",
            },
            votedAt:{
                type:Date,
                default:Date.now(),
            },
        }
    ],
    votecount:{
        type:Number,
        default:0,

    }




})
const candidatemodel=mongoose.model("Candidates",candidateschema);
module.exports=candidatemodel