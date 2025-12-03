const mongoose = require("mongoose");

 async function dbConnectt (){
    try{

      await  mongoose.connect(process.env.MONGO_URL)
        console.log("mongodb successfully connect");
        

    }
    catch(error){
        console.log(error,"somthing went wrong");
        

    }
}

module.exports = dbConnectt