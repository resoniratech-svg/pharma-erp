const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createBrand = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { brandName, shortName, description, isActive } = req.body;

    if (!brandName) {
      return res.status(400).json({ success: false, message: 'Brand name is required.' });
    }

    const newBrand = await prisma.brand.create({
      data: {
        brandName,
        shortName,
        description,
        isActive: isActive !== undefined ? isActive : true,
        companyId
      }
    });

    res.status(201).json({ success: true, data: newBrand });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Brand name already exists.' });
    }
    console.error('Error creating brand:', error);
    res.status(500).json({ success: false, message: 'Server error creating brand.' });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const brands = await prisma.brand.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, message: 'Server error fetching brands.' });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { brandName, shortName, description, isActive } = req.body;

    const existing = await prisma.brand.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: parseInt(id) },
      data: {
        brandName,
        shortName,
        description,
        isActive
      }
    });

    res.status(200).json({ success: true, data: updatedBrand });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Brand name already exists.' });
    }
    console.error('Error updating brand:', error);
    res.status(500).json({ success: false, message: 'Server error updating brand.' });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await prisma.brand.findFirst({
      where: { id: parseInt(id), companyId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Brand not found.' });
    }

    await prisma.brand.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ success: true, message: 'Brand deleted successfully.' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ success: false, message: 'Server error deleting brand.' });
  }
};
