const service = require("./lead.service");

const createLead = async (req, res) => {
  try {
    const data = await service.createLeadService(req.body);

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllLeads = async (req, res) => {
  const data = await service.getAllLeadsService();

  res.json({
    success: true,
    data,
  });
};

const getLeadById = async (req, res) => {
  const data = await service.getLeadByIdService(req.params.id);

  res.json({
    success: true,
    data,
  });
};

const updateLead = async (req, res) => {
  const data = await service.updateLeadService(
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data,
  });
};

const deleteLead = async (req, res) => {
  await service.deleteLeadService(req.params.id);

  res.json({
    success: true,
    message: "Lead deleted successfully",
  });
};

const getLeadsByMr = async (req, res) => {
  const data = await service.getLeadsByMrService(
    req.params.mrId
  );

  res.json({
    success: true,
    data,
  });
};

const assignLead = async (req, res) => {
  const data = await service.assignLeadService(
    req.params.id,
    req.body.mrId
  );

  res.json({
    success: true,
    data,
  });
};

const convertLead = async (req, res) => {
  const data = await service.convertLeadService(
    req.params.id
  );

  res.json({
    success: true,
    data,
  });
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadsByMr,
  assignLead,
  convertLead,
};