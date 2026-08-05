const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "branch",
    required: true
  },
  // product: {
  //   type: String,
  //   required: true
  // },
  // productId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "product",
  //   required: true
  // },
  mancapDocument: { type: String, default: '' },
  nafdacDocument: { type: String, default: '' },
  cacDocument: { type: String, default: '' },
  companyProfileDocument: { type: String, default: '' },
  rawMaterialsDocument: { type: String, default: '' },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ["New", "Renewal", "Ad-On"],
    default: "New"
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      "Submitted", "Issued", "Renewal", "Rejected", "Accepted", 
      "With Shari'a Board", "Successful", "Audit Session", "NC Closed", 
      "Audit Report Submitted", "Audited", "Product Forms Received", 
      "Invoice Sent", "Payment Received", "Shari'a Board Review", 
      "Application Successful"
    ],
    default: 'Submitted'
  },
  requestedDate: {
    type: Date,
    required: true
  },
  // Halal certification history
  hasAppliedBefore: {
    type: String,
    enum: ["yes", "no", "N/A"],
    required: true
  },
  previousHalalAgency: {
    type: String,
    default: ''
  },
  hasBeenSupervisedBefore: {
    type: String,
    enum: ["yes", "no", "N/A"],
    required: true
  },
  supervisingHalalAgency: {
    type: String,
    default: ''
  },

  // Food safety programs
  foodSafetyPrograms: {
    type: [String],
    enum: ["HACCP", "ISO-22000", "GMP", "QMS", "Other", "N/A"],
    required: true
  },
  otherFoodSafetyProgram: {
    type: String,
    default: ''
  },

  // Market type
  marketType: {
    type: String,
    enum: ["Food Service (Bulk)", "Retail", "Direct Marketing", "Industry", "Other", "N/A"],
    default: ''
  },
  marketTypeOther: {
    type: String,
    default: ''
  },

  // Brand information
  brandType: {
    type: String,
    enum: ["Owned", "Private Label", "Other", "N/A"],
    default: ''
  },
  brandTypeOther: {
    type: String,
    default: ''
  },

  // Product composition questions
  usesPorkOrDerivatives: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },
  usesAnimalMeatOrDerivatives: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },
  usesGelatinOrCapsule: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },
  containsAlcohol: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },
  additivesOrFlavourContainAlcohol: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },
  usesGlycerineOrDerivatives: {
    type: String,
    enum: ["yes", "no", 'N/A'],
    default: 'N/A'
  },

  // Geographic markets
  geographicMarkets: {
    type: [String],
    enum: ["Within Nigeria", "North Africa", "West Africa", "Europe", "Gulf Countries", "Asia", "United States", "Worldwide", "Other"],
    default: []
  },
  geographicMarketsOther: {
    type: String,
    default: ''
  },
  geopoliticalRegion: {
    type: String,
    default: ''
  },
  nigerianState: {
    type: String,
    default: ''
  },

  // Manufacturing facility information (if different from company)
  manufacturingFacility: {
    companyName: { type: String, default: '' },
    address: { type: String, default: '' },
    localGovtArea: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    plantContact: { type: String, default: '' },
    positionTitle: { type: String, default: '' },
    telephoneNo: { type: String, default: '' },
    emailAddress: { type: String, default: '' },
    webAddress: { type: String, default: '' },
    governmentPlantCode: { type: String, default: '' }
  },

  // Additional manufacturing locations
  additionalFacilities: [{
    companyName: { type: String },
    address: { type: String },
    localGovtArea: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    plantContact: { type: String },
    positionTitle: { type: String },
    telephoneNo: { type: String },
    emailAddress: { type: String }
  }],

  // Packaging plant information
  packagingPlant: {
    exists: { type: Boolean, default: false },
    companyName: { type: String, default: '' },
    address: { type: String, default: '' },
    localGovtArea: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    plantContact: { type: String, default: '' },
    positionTitle: { type: String, default: '' },
    telephoneNo: { type: String, default: '' },
    emailAddress: { type: String, default: '' }
  },

  // Application authorized by
  authorizedBy: {
    name: { type: String, default: '' },
    dateAuthorized: { type: Date },
    positionTitle: { type: String, default: '' }
  },

  // Application processing tracking
  processStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  processData: {
    // Step 2: Application Accepted
    acceptedAt: { type: Date },
    // Step 3: Invoice Sent
    invoiceFile: { type: String, default: '' }, // uploaded file path
    invoiceSentAt: { type: Date },
    // Step 4: Payment Received
    paymentConfirmedAt: { type: Date },
    // Step 5: Product Approval Forms Received
    productFormsReceivedAt: { type: Date },
    // Step 6: Audit Session (nested sub-steps)
    audit: {
      auditId: { type: String, default: '' }, // reference to the audit collection document
      status: { type: String, default: '' }, // track sub-status like 'Proposed', 'Counter Proposed', 'Date Concluded'
      scheduledDate: { type: Date },
      scheduledTime: { type: String, default: '' },
      proposedDates: [{
        date: { type: Date },
        time: { type: String },
        isCounter: { type: Boolean, default: false }
      }],
      auditors: [{
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        role: { type: String }
      }],
      leadAuditorName: { type: String, default: '' },
      leadAuditorEmail: { type: String, default: '' },
      leadAuditorPhone: { type: String, default: '' },
      auditedAt: { type: Date },
      ncReport: { type: String, default: '' }, // uploaded file
      ncClosedAt: { type: Date },
      ncCorrectionFile: { type: [String], default: [] }, // client uploaded correction(s)
      ncCorrectionUploadedAt: { type: Date },
      ncReminderSentAt: { type: Date },
      auditReportFile: { type: String, default: '' }, // uploaded file
      auditReportSubmittedAt: { type: Date },
      subStep: { type: Number, default: 0 } // 0=not started, 1-5 for sub-steps
    },
    // Step 7: Application Sent to Sharia Board
    shariaBoardSentAt: { type: Date },
    // Step 8: Application Successful
    certificationApprovedAt: { type: Date },
    // Step 9: Certificate Processing
    processingStartedAt: { type: Date },
    // Step 9: Certificate Issued
    labelFiles: { type: [String], default: [] },
    labelFileIds: [{ type: mongoose.Schema.Types.ObjectId }],
    certificateFiles: { type: [String], default: [] },
    certificateFileIds: [{ type: mongoose.Schema.Types.ObjectId }],
    certificateNumber: { type: String, default: '' },
    certificateExpiryDate: { type: Date },
    issuedAt: { type: Date }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
});

const applicationModel = mongoose.model('application', applicationSchema);
module.exports = applicationModel;