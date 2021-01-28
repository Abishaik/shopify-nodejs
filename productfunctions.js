const crypto = require('crypto');
const cookie = require('cookie');
const nonce=require('nonce')();
const querystring=require('querystring')
const request=require('request-promise');
const bodyParser =require('body-parser')
const { error } = require('console');
const { title } = require('process');


var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";



//##################################################################


const read_products =(req,res) =>{
    
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("tokens");
        dbo.collection('token').findOne({}, function(err, result) {
          if (err) throw err;
          const token =result['token']
          const shop = result['shop']
          console.log('access token is taken from DB')
          const apiRequestUrl="https://"+shop+'/admin/products.json';
          const apiRequestHeader ={
              'X-Shopify-Access-Token': token
          };
          request.get(apiRequestUrl,{headers: apiRequestHeader})
          .then((apiResponse) =>{
            res.send(apiResponse);
          })
          .catch((error) =>{
            res.send(error.message)
          })
          console.log("Access Granted !");
          db.close();
        });
    });
};

//##########################################################


const add_product= function(req,res) {
     const new_product={
         "product": {
           "title": req.body.title,
           "body_html": req.body.body_html,
           "vendor": req.body.vendor,
           "product_type": req.body.product_type,
           "tags": req.body.tags
         }
       }
     MongoClient.connect(mongoUrl, function(err,db){
         if (err) throw err;
         var dbo = db.db("tokens");
         dbo.collection('token').findOne({},function(err,result){
             if (err) throw err;
             const token =result['token']
             const shop = result['shop']
             console.log('access token is taken from DB')
             const apiRequestUrl="https://"+shop+'/admin/products.json';
             options ={
                 method:'POST',
                 uri:apiRequestUrl,
                 json:true,
                 headers:{
                     'X-Shopify-Access-Token':token,
                     'Content-Type': 'application/json'
                 },
                 body: new_product
             };
             var dbi =db.db('Products')
             dbi.collection('testProducts').insertOne(new_product);
             db.close();
             request.post(options)
                 .then(function(response){
                  
                     if (response.statusCode ==201){
                         res.json(true);
                     } else {
                         res.json('Added to store and MongoDB');
                     }
                     return(response.body)
                 })
                 .catch(function(err){
                     res.json(err);
                 });
         db.close();       
         })
     })
};

const update_product = function(req,res) {
    const pid = req.query.pid
    const updated_product={
        "product": {
            "id":req.body.id,
          "title": req.body.title
        }
      }
    MongoClient.connect(mongoUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("Shopifydb");
        dbo.collection('token').findOne({},function(err,result){
            if (err) throw err;
            const token =result['token']
            const shop = result['shop']
            console.log('access token is taken from DB')
            const apiRequestUrl="https://"+shop+'/admin/products/'+pid+'.json';
            options ={
                method:'PUT',
                uri:apiRequestUrl,
                json:true,
                headers:{
                    'X-Shopify-Access-Token':token,
                    'Content-Type': 'application/json'
                },
                body: updated_product
            };
            request.put(options)
                .then(function(response){
                 
                    if (response.statusCode ==201){
                        res.json(true);
                    } else {
                        res.json('Updated to store');
                    }
                    return(response.body)
                })
                .catch(function(err){
                    res.json(err);
                });
        db.close();       
        })
    })
};






module.exports={read_products,add_product,update_product}