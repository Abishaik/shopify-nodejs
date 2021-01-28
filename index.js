
const express = require('express')
const app = express();
const bodyParser =require('body-parser')

app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const mainfunctions =require('./mainfunsctions')
const productfunctions =require('./productfunctions')
const orderfunctions =require('./orderfunctions')
const inventoryfunctions =require('./inventoryfunctions')

//main functions
app.get('/shopify',(mainfunctions.shopify_main))//working
app.get('/shopify/callback',(mainfunctions.callback))//working
//product functions
app.get('/get_access_and_show_products',(productfunctions.read_products))//working
app.post('/get_access_and_add_product',(productfunctions.add_product))//working
app.post('/get_access_and_update_product',(productfunctions.update_product))//working
//order functions
app.post('/get_access_and_create_order',(orderfunctions.create_order))//working
app.get('/get_access_and_show_orders',(orderfunctions.show_orders))//working
app.post('/get_access_and_update_order',(orderfunctions.update_order))//working
//inventory functions
app.get('/get_access_and_show_inventory',(inventoryfunctions.show_inventory))//working
app.post('/get_access_and_update_inventory',(inventoryfunctions.update_inventory))//working

app.listen(5000,() =>{
    console.log("This app listening port 5000")
})

//Unhandled rejection Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client