const branchModel = require("../Models/branch");
const mongoose = require("mongoose");

const createBranch = async (req, res, next) => {
    try {
        const { branchName, address, lga, city, state, country, contactName, contactNumber, positionTitle, webAddress, governmentPlantCode } = req.body;
        
        // Use companyOwnerId so sub-users create branches under the parent company
        const companyId = req.companyOwnerId || req.user.id;

        const newBranch = await branchModel.create({
            companyId,
            branchName,
            address,
            lga,
            city,
            state,
            country,
            contactName,
            contactNumber,
            positionTitle,
            webAddress,
            governmentPlantCode
        });

        res.status(201).json({
            status: "success",
            message: "Branch created successfully",
            branch: newBranch
        });
    } catch (error) {
        next(error);
    }
};

const getCompanyBranches = async (req, res, next) => {
    try {
        // Use companyOwnerId so sub-users see parent company branches
        const companyId = req.params.companyId || req.companyOwnerId || req.user.id;
        
        const branches = await branchModel.find({ companyId });

        res.status(200).json({
            status: "success",
            count: branches.length,
            branches
        });
    } catch (error) {
        next(error);
    }
};

const getBranchById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const branch = await branchModel.findById(id);

        if (!branch) {
            return res.status(404).json({
                status: "error",
                message: "Branch not found"
            });
        }

        res.status(200).json({
            status: "success",
            branch
        });
    } catch (error) {
        next(error);
    }
};

const updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedBranch = await branchModel.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedBranch) {
            return res.status(404).json({
                status: "error",
                message: "Branch not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Branch updated successfully",
            branch: updatedBranch
        });
    } catch (error) {
        next(error);
    }
};

const deleteBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedBranch = await branchModel.findByIdAndDelete(id);

        if (!deletedBranch) {
            return res.status(404).json({
                status: "error",
                message: "Branch not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Branch deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBranch,
    getCompanyBranches,
    getBranchById,
    updateBranch,
    deleteBranch
};
