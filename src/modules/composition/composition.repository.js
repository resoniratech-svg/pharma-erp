const prisma = require("../../config/db");

const getAllCompositionsRepo = async () => {
  const compositions = await prisma.composition.findMany({
    orderBy: { createdAt: "desc" },
  });

  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        brandName: true,
        composition: true,
        genericName: true,
        mrp: true,
        status: true,
      },
    });

    return compositions.map((c) => {
      const cName = (c.genericName || "").trim().toLowerCase();
      const matched = products.filter((p) => {
        const pComp = (p.composition || "").trim().toLowerCase();
        const pGen = (p.genericName || "").trim().toLowerCase();
        return (pComp && pComp === cName) || (pGen && pGen === cName);
      });

      return {
        ...c,
        associatedProducts: matched.length,
        products: matched,
      };
    });
  } catch (err) {
    console.error("Error fetching linked products for compositions:", err);
    return compositions.map((c) => ({
      ...c,
      associatedProducts: 0,
      products: [],
    }));
  }
};

const getCompositionByIdRepo = async (id) => {
  const composition = await prisma.composition.findUnique({ where: { id } });
  if (!composition) return null;

  try {
    const cName = (composition.genericName || "").trim().toLowerCase();
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        brandName: true,
        composition: true,
        genericName: true,
        mrp: true,
        status: true,
      },
    });

    const matched = allProducts.filter((p) => {
      const pComp = (p.composition || "").trim().toLowerCase();
      const pGen = (p.genericName || "").trim().toLowerCase();
      return (pComp && pComp === cName) || (pGen && pGen === cName);
    });

    return {
      ...composition,
      associatedProducts: matched.length,
      products: matched,
    };
  } catch (err) {
    return {
      ...composition,
      associatedProducts: 0,
      products: [],
    };
  }
};

const createCompositionRepo = (data) => {
  return prisma.composition.create({ data });
};

const updateCompositionRepo = (id, data) => {
  return prisma.composition.update({ where: { id }, data });
};

const deleteCompositionRepo = (id) => {
  return prisma.composition.delete({ where: { id } });
};

module.exports = {
  getAllCompositionsRepo,
  getCompositionByIdRepo,
  createCompositionRepo,
  updateCompositionRepo,
  deleteCompositionRepo,
};
