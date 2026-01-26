const applicationModel = require('../Models/application');
const userModel = require('../Models/user');

// Get all applications
const getApplications = async (req, res) => {
    const query = req.query
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
    const {product, category} = req.body
    
  try {
    const company = await userModel.findById(id)

    // For renewal applications, skip duplicate check
    if (category !== 'Renewal Application') {
      // Check if there is an application for the product
      const existingApplication = await applicationModel.findOne({
        companyId: company.registrationNo,
        product,
        category: { $ne: 'Renewal Application' } // Exclude renewals from check
      });
      
      if (existingApplication) {
        return res.status(400).json({ 
          message: 'Application already exists for this product. Please use Renewal option for updates.' 
        });
      }
    }

    // Generate application number
    const timestamp = Date.now().toString().slice(-8);
    const prefix = company.companyName.slice(0, 2).toUpperCase();
    
    // Use different prefix for renewals
    let applicationNumber;
    if (category === 'Renewal Application') {
      applicationNumber = `REN-${timestamp}`;
    } else {
      applicationNumber = `APP-${timestamp}`;
    }
    
    // Handle Halal certification history fields
    const applicationData = {
      ...req.body,
      applicationNumber,
      companyId: company.registrationNo,
      requestedDate: req.body.requestedDate || new Date()
    };
    
    // Validate Halal certification fields
    if (!applicationData.hasAppliedBefore) {
      return res.status(400).json({ 
        message: 'Has the company ever applied for Halal certification previously? is required' 
      });
    }
    
    if (!applicationData.hasBeenSupervisedBefore) {
      return res.status(400).json({ 
        message: 'Has the factory ever been supervised before? is required' 
      });
    }
    
    // Clear agency fields if answer is "no"
    if (applicationData.hasAppliedBefore === 'no') {
      applicationData.previousHalalAgency = '';
    }
    
    if (applicationData.hasBeenSupervisedBefore === 'no') {
      applicationData.supervisingHalalAgency = '';
    }
    
    const application = new applicationModel(applicationData);
    const savedApplication = await application.save();
    
    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    // Handle Halal certification history fields in updates
    const updateData = { ...req.body };
    
    // Clear agency fields if answer is "no"
    if (updateData.hasAppliedBefore === 'no') {
      updateData.previousHalalAgency = '';
    }
    
    if (updateData.hasBeenSupervisedBefore === 'no') {
      updateData.supervisingHalalAgency = '';
    }
    
    const updatedApplication = await applicationModel.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// Get applications for renewal (only Approved or Certified)
const getRenewalApplications = async (req, res) => {
  const company = req.user
  
  try {
    let build = {
      status: { $in: ['Approved', 'Certified'] }
    };
    
    // If not admin, only show their own applications
    if (req.user.role !== "admin" && company.registrationNo) {
      build.companyId = company.registrationNo;
    }
    
    const applications = await applicationModel.find(build)
      .select('applicationNumber category product createdAt hasAppliedBefore previousHalalAgency hasBeenSupervisedBefore supervisingHalalAgency')
      .sort({ createdAt: -1 });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search applications
const searchApplications = async (req, res) => {
  const { applicationNumber, date, status, category } = req.query;
  const company = req.user;
  
  try {
    let build = {};
    
    // Application number search
    if (applicationNumber) {
      build.applicationNumber = { $regex: applicationNumber, $options: 'i' };
    }
    
    // Date search (assuming date is in YYYY-MM-DD format)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      build.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Status filter
    if (status) {
      build.status = status;
    }
    
    // Category filter
    if (category) {
      build.category = category;
    }
    
    // If not admin, only show their own applications
    if (req.user.role !== "admin" && company.registrationNo) {
      build.companyId = company.registrationNo;
    }
    
    const applications = await applicationModel.find(build)
      .sort({ createdAt: -1 });
    
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
  getRenewalApplications,
  searchApplications
};