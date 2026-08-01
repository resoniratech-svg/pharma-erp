const svc = require("./composition.service");

const getAll = async (req, res) => {
  try {
    const data = await svc.getAllCompositions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getCompositionById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Composition not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { genericName, strength, dosageForm, therapeuticClass, schedule, description, status, createdBy } = req.body;
    if (!genericName) return res.status(400).json({ success: false, message: "genericName is required" });
    const data = await svc.createComposition({
      genericName,
      strength: strength || null,
      dosageForm: dosageForm || null,
      therapeuticClass: therapeuticClass || null,
      schedule: schedule || null,
      description: description || null,
      status: status || "Active",
      createdBy: createdBy || req.user?.name || req.user?.email || "System",
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { genericName, strength, dosageForm, therapeuticClass, schedule, description, status } = req.body;
    const data = await svc.updateComposition(Number(req.params.id), {
      ...(genericName !== undefined && { genericName }),
      ...(strength !== undefined && { strength }),
      ...(dosageForm !== undefined && { dosageForm }),
      ...(therapeuticClass !== undefined && { therapeuticClass }),
      ...(schedule !== undefined && { schedule }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await svc.deleteComposition(Number(req.params.id));
    res.json({ success: true, message: "Composition deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getById, create, update, remove };
