const ImpersonateLog = require('../Models/impersonateLog');

// POST /api/impersonate-logs
// Called automatically when admin impersonates a client
const createLog = async (req, res, next) => {
  try {
    const admin = req.user;
    const { clientId, clientName, clientEmail } = req.body;

    const log = await ImpersonateLog.create({
      adminId: admin._id || admin.id,
      adminName: admin.name || admin.fullName,
      adminEmail: admin.email,
      clientId,
      clientName,
      clientEmail
    });

    res.status(201).json({
      status: 'success',
      message: 'Impersonation session started',
      log
    });
  } catch (error) {
    console.error('createLog error:', error);
    next(error);
  }
};

// PATCH /api/impersonate-logs/:id/end
// Called when the admin ends the session
const endLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await ImpersonateLog.findByIdAndUpdate(
      id,
      { endedAt: new Date() },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ status: 'error', message: 'Log not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Impersonation session ended',
      log
    });
  } catch (error) {
    console.error('endLog error:', error);
    next(error);
  }
};

// GET /api/impersonate-logs
// Returns all logs, newest first
const getLogs = async (req, res, next) => {
  try {
    const user = req.user;
    const isAuthorized = user?.role === 'super admin' || user?.isBuilder === true;
    if (!isAuthorized) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to impersonation logs'
      });
    }

    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { adminName: { $regex: search, $options: 'i' } },
        { adminEmail: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      ImpersonateLog.find(query)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ImpersonateLog.countDocuments(query)
    ]);

    res.status(200).json({
      status: 'success',
      total,
      page: parseInt(page),
      logs
    });
  } catch (error) {
    console.error('getLogs error:', error);
    next(error);
  }
};

module.exports = { createLog, endLog, getLogs };
