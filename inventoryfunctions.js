const crypto = require('crypto');
const cookie = require('cookie');
const nonce=require('nonce')();
const querystring=require('querystring')
const request=require('request-promise');
const bodyParser =require('body-parser')
const { error } = require('console');
const { title } = require('process');


var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";


const show_inventory=(req,res)=>{
    const productid =req.query.pid
    const variantid =req.query.vid
    MongoClient.connect(mongoUrl, function(err,db){
        if (err) throw err;
        var dbo = db.db("tokens");
        dbo.collection('token').findOne({},function(err,result){
            if (err) throw err;
            const token =result['token']
            const shop = result['shop']

            const apiRequestUrl="https://"+shop+'/admin/products/'+productid+'variants/'+variantid+'./json';
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
                        dbo.collection('Inventory').updateOne('inventory',apiResponse)
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

//https://370751c1b7b7.ngrok.io/get_access_and_show_inventory?pid=5919894634666?vid=37005815251114

const update_inventory =function(req,res) {
    const iid =req.query.iid
    const updated_inventory={
        "inventory_item": {
          "id": req.body.iid ,
          "cost": req.body.sku
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
            const apiRequestUrl="https://"+shop+'/admin/inventory_items/'+iid+'.json';
            options ={
                method:'PUT',
                uri:apiRequestUrl,
                json:true,
                headers:{
                    'X-Shopify-Access-Token':token,
                    'Content-Type': 'application/json'
                },
                body: updated_inventory
            };
            request.put(options)
                .then(function(response){
                 
                    if (response.statusCode ==201){
                        res.json(true);
                    } else {
                        res.json('Inventory Updated to store');
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


module.exports={show_inventory,update_inventory}


