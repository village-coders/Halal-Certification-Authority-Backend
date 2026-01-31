const express = require('express');

const productRouter = express.Router()

const {createProduct, getMyProducts, deleteMyProduct, getAllProducts, getSingleProducts} = require("../Controllers/productController.js");
const isLoggedIn = require('../Middlewares/isLoggedIn.js');
const isAdmin = require('../Middlewares/isAdmin.js');

// CREATE a product
productRouter.post("/", isLoggedIn, createProduct);

// LIST all products (admin only)
productRouter.get("/admin-all", getAllProducts);

// LIST my products
productRouter.get("/", isLoggedIn, getMyProducts);

// GET single product by ID
productRouter.get("/:id", getSingleProducts);

// DELETE product
productRouter.delete("/:id", isLoggedIn, deleteMyProduct);



module.exports = productRouter  