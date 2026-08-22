const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createManufacturer = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, contactPerson, contactPhone, contactEmail, address, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Manufacturer name is required.' });
    }

    const newManufacturer = await prisma.manufacturer.create({
      data: {
        name,
        contactPerson,
        contactPhone,
        contactEmail,
        address,
        isActive: isActive !== undefined ? isActive : true,
        companyId
      }
    });

    res.status(201).json({ success: true, data: newManufacturer });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Manufacturer name already exists.' });
    }
    console.error('Error creating manufacturer:', error);
    res.status(500).json({ success: false, message: 'Server error creating manufacturer.' });
  }
};

exports.getManufacturers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const manufacturers = await prisma.manufacturer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: manufacturers });
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching manufacturers.' });
  }
};

exports.updateManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, contactPerson, contactPhone, contactEmail, address, isActive } = req.body;

    const existing = await prisma.manufacturer.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found.' });
    }

    const updatedManufacturer = await prisma.manufacturer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contactPerson,
        contactPhone,
        contactEmail,
        address,
        isActive
      }
    });

    res.status(200).json({ success: true, data: updatedManufacturer });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Manufacturer name already exists.' });
    }
    console.error('Error updating manufacturer:', error);
    res.status(500).json({ success: false, message: 'Server error updating manufacturer.' });
  }
};

exports.deleteManufacturer = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.manufacturer.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Manufacturer not found.' });
    }

    await prisma.manufacturer.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ success: true, message: 'Manufacturer deleted successfully.' });
  } catch (error) {
    console.error('Error deleting manufacturer:', error);
    res.status(500).json({ success: false, message: 'Server error deleting manufacturer.' });
  }
};
