const express = require('express');

const productRouter = express.Router()

const {createProduct, getMyProducts, deleteMyProduct, getAllProducts} = require("../Controllers/productController.js");
const isLoggedIn = require('../Middlewares/isLoggedIn.js');
const isAdmin = require('../Middlewares/isAdmin.js');

productRouter.post("/", isLoggedIn, createProduct);
productRouter.get("/", isLoggedIn, getMyProducts);
productRouter.get("/all", isAdmin, getAllProducts);
productRouter.delete("/:id", isLoggedIn, deleteMyProduct);

module.exports = productRouter  