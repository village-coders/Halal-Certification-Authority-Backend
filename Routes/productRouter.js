const express = require('express');

const productRouter = express.Router()

const {createProduct, getMyProducts, deleteMyProduct} = require("../Controllers/productController.js");
const isLoggedIn = require('../Middlewares/isLoggedIn.js');

productRouter.post("/", isLoggedIn, createProduct);
productRouter.get("/", isLoggedIn, getMyProducts);
productRouter.delete("/:id", isLoggedIn, deleteMyProduct);

module.exports = productRouter  