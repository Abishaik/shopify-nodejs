const dotenv = require('dotenv').config();
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


const apiKey=process.env.SHOPIFY_API_KEY;
const apiSecret=process.env.SHOPIFY_API_SECRET;
const scope='write_products,read_products,write_orders,read_orders,read_product_listings,read_inventory,write_inventory,read_price_rules,write_price_rules';
const forwardingAddress="http://localhost:5000";


//######################################################

const shopify_main = (req,res)=>{
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
};

//############################################################

const callback= (req,res) =>{
    const {shop, hmac, code, state} =req.query;
    const stateCookie =cookie.parse(req.headers.cookie).state
    if(state !== stateCookie){
        return res.status(403).send('Request object is not verified')
    }
    if(shop && hmac && code){
        const map=Object.assign({},req.query);
        delete map['hmac'];
        const message=querystring.stringify(map);
        const generatedHash=crypto
            .createHmac('sha256',apiSecret)
            .update(message)
            .digest('hex');
        if(generatedHash!==hmac){
            return res.status(400).send('HMAC validation fail');
        }
        const accessTokenRequestUrl="https://"+shop+"/admin/oauth/access_token";
        const accessTokenPayload={
            client_id:apiKey, 
            client_secret:apiSecret,
            code:code
        }
        console.log(accessTokenRequestUrl)
        request.post(accessTokenRequestUrl,{json:accessTokenPayload})
        .then((accessTokenResponse) =>{
            const accessToken = accessTokenResponse.access_token;
            console.log(accessToken);
            MongoClient.connect(mongoUrl, function(err, db) {
                if (err) throw err;
                var dbo = db.db("tokens");
                var myobj = { token : accessToken ,shop :shop};
                dbo.collection("token").insertOne(myobj, function(err, res) {
                  if (err) throw err;
                  console.log("1 token added to db");
                 
                  db.close();

                });
              });
            res.send("Access Token Added to DB")  
        })
        .catch((error) =>{
            res.status(error.statusCode).send(error.error.error_description);
        });

   }
   else{
       res.status(400).send('required parametre missing');
   }
}

    

module.exports={shopify_main,callback}