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



const show_orders = (req,res)=>{
    MongoClient.connect(mongoUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("tokens");
        dbo.collection('token').findOne({},function(err,result){
            if (err) throw err;
            const token =result['token']
            const shop = result['shop']
            console.log('access token is taken from DB')

            const apiRequestUrl="https://"+shop+'/admin/orders.json?status=any';
            options ={
                method:'GET',
                uri:apiRequestUrl,
                json:true,
                headers:{
                    'X-Shopify-Access-Token':token,
                    'Content-Type': 'application/json'

                }
            };
            request.get(options)
                .then(function(response){
                    if(response.statusCode==201){
                        res.send(true);
                    } else{
                        res.send(response);
                        dbo.collection('Orders').updateOne('orders',apiResponse)
                    }
                    return(response.body)
                })
                .catch(function(err){
                    res.json(err);
                });
            db.close();    
        })
    })

}

const create_order = (req,res)=>{
    const new_order ={
        "order": {
          "line_items": [
            {
              "variant_id": req.body.variant_id,
              "quantity": req.body.quantity
            }
          ]
        }
      }
    MongoClient.connect(mongoUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("tokens");
        dbo.collection('token').findOne({},function(err,result){
            if (err) throw err;
            const token =result['token']
            const shop = result['shop']
            console.log('access token is : '+token);
            console.log('shop name is : '+shop);

            const apiRequestUrl="https://"+shop+'/admin/orders.json';
            options ={
                method:'POST',
                uri:apiRequestUrl,
                json:true,
                headers:{
                    'X-Shopify-Access-Token':token,
                    'Content-Type': 'application/json'

                },
                body: new_order
            };
            var dbi =db.db('Orders')
            dbi.collection('testOrders').insertOne(new_order);
            db.close();

            request.post(options)
                .then(function(response){
                    if(response.statusCode==201){
                        res.send(true);
                    } else{
                        res.json('Order created and added to db');
                    }
                    return(response.body)
                })
                .catch(function(err){
                    res.json(err);
                });
            db.close();    
        })
    })

}

const update_order =function(req,res) {
    const oid =req.query.oid
    const updated_order={
        "order": {
          "id": req.body.id,
          "tags":req.body.tags
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
            const apiRequestUrl="https://"+shop+'/admin/orders/'+oid+'.json';
            options ={
                method:'PUT',
                uri:apiRequestUrl,
                json:true,
                headers:{
                    'X-Shopify-Access-Token':token,
                    'Content-Type': 'application/json'
                },
                body: updated_order
            };
            request.put(options)
                .then(function(response){
                 
                    if (response.statusCode ==201){
                        res.json(true);
                    } else {
                        res.json('Order Updated to store');
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


module.exports={create_order,update_order,show_orders}