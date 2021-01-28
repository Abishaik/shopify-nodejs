const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce=require('nonce')();
const querystring=require('querystring')
const request=require('request-promise');
const bodyParser =require('body-parser')
const { error } = require('console');
const { title } = require('process');

app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";


const apiKey=process.env.SHOPIFY_API_KEY;
const apiSecret=process.env.SHOPIFY_API_SECRET;
const scope='write_products,read_products,write_orders,read_orders,read_product_listings,read_inventory,write_inventory,read_price_rules,write_price_rules';
const forwardingAddress="http://localhost:5000"

//console.log(apiSecret,apiKey,scopes,forwardingAddress)
    
app.get('/shopify',(req,res)=>{
    const shop=req.query.shop;
    if(shop){
        const state=nonce();
        const redirectUri=forwardingAddress+'/shopify/callback';
        const installUrl='https://'+shop+'/admin/oauth/authorize?client_id='+apiKey+
        '&scope='+scope+
        '&state='+state+
        '&redirect_uri='+redirectUri;
        res.cookie('state',state);
        console.log(installUrl)
        res.redirect(installUrl);
    }else{
        return res.status(400).send("Not done-->")
    }
});


app.get('/shopify/callback',(req,res) =>{
    const {shop, hmac, code, state} =req.query;
    const stateCookie =cookie.parse(req.headers.cookie).state;

    if(state !== stateCookie){
        return res.status(403).send('Request object is not verified');

    }
    if(shop && hmac && code){
        console.log(code)
//         const map=Object.assign({},req.query);
//         delete map['hmac'];
//         const message=querystring.stringify(map);
//         const generatedHash=crypto
//             .createHmac('sha256',apiSecret)
//             .update(message)
//             .digest('hex');
//         if(generatedHash!==hmac){
//             return res.status(400).send('HMAC validation fail');
//         }
//         const accessTokenRequestUrl="https://"+shop+"/admin/oauth/access_token";
//         const accessTokenPayload={
//             client_id:apiKey, 
//             client_secret:apiSecret,
//             code:code
//         }
//         console.log(accessTokenRequestUrl)
//         request.post(accessTokenRequestUrl,{json:accessTokenPayload})
//         .then((accessTokenResponse) =>{
//             const accessToken = accessTokenResponse.access_token;
//             console.log(accessToken);
//             console.log("****************************RESPONSE **********************");
//             console.log(accessTokenResponse)
// 
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) throw err;
//                 var dbo = db.db("tokens");
//                 var myobj = { token : accessToken ,shop :shop};
//                 dbo.collection("token").insertOne(myobj, function(err, res) {
//                   if (err) throw err;
//                   console.log("1 token added to db");
//                   
//                   db.close();
// 
//                 });
//               });
//             res.send("Access Token Added to DB")  
//         })
//         .catch((error) =>{
//             res.status(error.statusCode).send(error.error.error_description);
//         });

    }
    else{
        res.status(400).send('required parametre missing');
    }
});    

app.get('/get_access_and_read_products',(req,res) =>{
    
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) throw err;
        var dbo = db.db("tokens");
        dbo.collection('token').findOne({}, function(err, result) {
          if (err) throw err;
          const token =result['token']
          const shop = result['shop']
          console.log('access token is : '+token);
          console.log('shop name is : '+shop);

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
    
});

app.post('/get_access_and_add_products',function(req,res) {
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
            console.log('access token is : '+token);
            console.log('shop name is : '+shop);

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

});


app.post('/create_order',(req,res)=>{
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
                        res.send('Order created and added to DB');
                    } else{
                        res.json(err);
                    }
                    return(response.body)
                })
                .catch(function(err){
                    res.json(err);
                });
            db.close();    
        })
    })

})
    
















app.listen(5000,() =>{
    console.log("This app listening port5000")
})




