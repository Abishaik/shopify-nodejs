


//for getting token

const dotenv=require('dotenv').config();
const express=require('express');
const app=express();
const cookie=require('cookie');
const nonce = require('nonce')();
const querystring=require('querystring')
const request=require('request-promise')
const crypto=require('crypto')

const apiKey=process.env.SHOPIFY_API_KEY;
const apiSecret=process.env.SHOPIFY_API_SECRET;
const scopes='write_products';
const forwardingAddress="https://8399d4ad7453.ngrok.io";

app.get('/shopif',(req,res)=>{
    //console.log(process.env)
    const shop=req.query.shop;
    if(shop){
        const state=nonce();
        const redirectUri=forwardingAddress+'/shopify/callback';
        const installUrl='https://'+shop+'/admin/oauth/authorize?client_id='+apiKey+'&scope='+scopes+'&state='+state+'&redirect_uri='+redirectUri;
        res.cookie('state',state);
        console.log(installUrl)
        res.redirect(installUrl);
    }else{
        return res.status(400).send("Missing shop parameter ")
    }
})
app.get('/shopify/callback',(req,res)=>
{
    res.send("sdssd")
})

app.listen(3000,()=>{
    console.log("Server running on port 3000")
})

//for saving in db

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("tokens");
  var myobj = { token :"df8gdf76gdf5v6x7vb5czf6v567zx" };
  dbo.collection("token").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 token added to db");
    db.close();
  });
});