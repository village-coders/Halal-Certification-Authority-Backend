const Setting = require('../Models/setting');

// Get setting by key
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    let setting = await Setting.findOne({ key });
    
    // Default values if setting not found in DB
    if (!setting) {
      if (key === 'renewWindowDays') {
        return res.status(200).json({
          status: 'success',
          data: { key, value: 90 } // default 3 months (90 days)
        });
      }
      return res.status(404).json({
        status: 'error',
        message: `Setting with key ${key} not found`
      });
    }

    res.status(200).json({
      status: 'success',
      data: setting
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update setting by key
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Value is required'
      });
    }

    // Only user with isBuilder === true can change settings
    if (!req.user || !req.user.isBuilder) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only Builder can modify settings.'
      });
    }

    let setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );

    res.status(200).json({
      status: 'success',
      data: setting
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  getSetting,
  updateSetting
};
