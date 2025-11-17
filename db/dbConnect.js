const mongoose = require("mongoose");

 async function dbConnectt (){
    try{

      await  mongoose.connect ("mongodb://localhost:27017/facebook")
        console.log("mongodb successfully connect");
        

    }
    catch(error){
        console.log(error,"somthing went wrong");
        

    }
}

module.exports = dbConnectt