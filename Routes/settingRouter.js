const express = require('express');
const settingRouter = express.Router();
const { getSetting, updateSetting } = require('../Controllers/settingController');
const isLoggedIn = require('../Middlewares/isLoggedIn');

// Read setting - anyone logged in (or public depending on needs) can read settings
settingRouter.get('/:key', getSetting);

// Update setting - logged in builder only
settingRouter.put('/:key', isLoggedIn, updateSetting);

module.exports = settingRouter;
