const express = require("express")
const mongoose = require("mongoose")

const UserModel = new mongoose.Schema({
    name:{
         type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },

    gender: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"
    },
    image: {
    type: String,
    default: null
}


})

const User = mongoose.model("User", UserModel)

module.exports = User