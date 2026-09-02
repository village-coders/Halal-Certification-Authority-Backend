const CompanyLog = require('../Models/companyLog');
const userModel = require('../Models/user');

const updateCompanyDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = req.user;

    // Check privilege
    const hasPrivilege =
      admin.role === 'super admin' ||
      admin.privileges?.includes('Manage Companies') ||
      admin.privileges?.includes('Company Manager');

    if (!hasPrivilege) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: You do not have permission to manage company details'
      });
    }

    const company = await userModel.findById(id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Company not found'
      });
    }

    const { companyName, email, fullName } = req.body;

    // Email uniqueness check if email is changed
    if (email && email.trim().toLowerCase() !== company.email?.toLowerCase()) {
      const formattedEmail = email.trim().toLowerCase();
      const existingUser = await userModel.findOne({ email: formattedEmail, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User/Company with this email already exists'
        });
      }
    }

    const changes = [];

    if (companyName !== undefined && companyName !== company.companyName) {
      changes.push({
        field: 'Company Name',
        before: company.companyName || '',
        after: companyName
      });
    }

    if (email !== undefined && email.trim().toLowerCase() !== (company.email || '').toLowerCase()) {
      changes.push({
        field: 'Email',
        before: company.email || '',
        after: email.trim().toLowerCase()
      });
    }

    if (fullName !== undefined && fullName !== company.fullName) {
      changes.push({
        field: 'Contact Person',
        before: company.fullName || '',
        after: fullName
      });
    }

    if (changes.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No changes detected',
        user: company
      });
    }

    // Apply updates directly (without triggering email verification)
    if (companyName !== undefined) company.companyName = companyName;
    if (email !== undefined) company.email = email.trim().toLowerCase();
    if (fullName !== undefined) company.fullName = fullName;
    company.updatedAt = new Date();

    await company.save();

    // Create log record
    const log = await CompanyLog.create({
      adminId: admin._id,
      adminName: admin.fullName || admin.companyName || 'Admin',
      adminEmail: admin.email,
      companyId: company._id,
      companyName: company.companyName || companyName || 'Company',
      changes
    });

    res.status(200).json({
      status: 'success',
      message: 'Company details updated successfully',
      user: company,
      log
    });
  } catch (error) {
    console.error('Error updating company details:', error);
    next(error);
  }
};

const getCompanyLogs = async (req, res, next) => {
  try {
    const admin = req.user;

    // Only isBuilder can view logs
    if (!admin.isBuilder && admin.role !== 'super admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: Only builder accounts can view company edit logs'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || '';

    const filter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { adminName: searchRegex },
        { adminEmail: searchRegex },
        { companyName: searchRegex }
      ];
    }

    const total = await CompanyLog.countDocuments(filter);
    const logs = await CompanyLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching company logs:', error);
    next(error);
  }
};

module.exports = {
  updateCompanyDetails,
  getCompanyLogs
};
