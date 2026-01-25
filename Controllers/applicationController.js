const applicationModel = require('../Models/application');
const userModel = require('../Models/user');

// Get all applications
const getApplications = async (req, res) => {
    const query = req.query
    // console.log(query);

    const company = req.user
    
  try {
    let build = {}
    if(query.status){
        build.status = query.status
    }
    if(query.category){
        build.category = query.category
    }
    if(req.user.role !== "admin" && company.registrationNo){
        build.companyId = company.registrationNo
    }    

    const applications = await applicationModel.find(build).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single application
const getApplication = async (req, res) => {
  try {
    const application = await applicationModel.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create application
const createApplication = async (req, res) => {
    const id = req.user.id
    const {product} = req.body
  try {
    const company = await userModel.findById(id)

    // console.log(company);
    
    // check if there is an application for the product
    const existingApplication = await applicationModel.findOne({
      companyId: company.registrationNo,
      product
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'Application already exists for this product' });
    }
    

    // Generate application number
    const timestamp = Date.now().toString().slice(-8);
    const prefix = company.companyName.slice(0, 2).toUpperCase();
    console.log(prefix);
    
    const applicationNumber = `${prefix}/${timestamp}`;
    
    const application = new applicationModel({
        ...req.body,
        applicationNumber,
        companyId: company.registrationNo,
        requestedDate: req.body.requestedDate || new Date()
    });
    
    const savedApplication = await application.save();
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const updatedApplication = await applicationModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(updatedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const deletedApplication = await applicationModel.findByIdAndDelete(req.params.id);
    
    if (!deletedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get applications for renewal
const getRenewalApplications = async (req, res) => {
  try {
    const applications = await applicationModel.find({
      status: { $in: ['Approved', 'Certified'] }
    }).select('applicationNumber category product createdAt');
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getRenewalApplications
};