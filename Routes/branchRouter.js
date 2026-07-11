const express = require("express");
const { createBranch, getCompanyBranches, getBranchById, updateBranch, deleteBranch } = require("../Controllers/branchController");
const isLoggedIn = require("../Middlewares/isLoggedIn");
const isAdmin = require("../Middlewares/isAdmin");

const branchRouter = express.Router();

branchRouter.use(isLoggedIn);

branchRouter.post("/", createBranch);
branchRouter.get("/", getCompanyBranches);
branchRouter.get("/company/:companyId", getCompanyBranches);
branchRouter.get("/:id", getBranchById);
branchRouter.put("/:id", isAdmin, updateBranch);
branchRouter.delete("/:id", isAdmin, deleteBranch);

module.exports = branchRouter;
