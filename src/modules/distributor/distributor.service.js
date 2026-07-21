const repository = require("./distributor.repository");

const getDistributorsService = async () => {
  return repository.getDistributorsRepo();
};

const createDistributorService = async (data) => {
  if (!data.code || data.code.startsWith("DSP")) {
    const existing = await repository.getDistributorsRepo();
    let maxNumber = 0;
    existing.forEach((r) => {
      if (r.code && (r.code.startsWith("DIST-") || r.code.startsWith("DSP"))) {
        const numStr = r.code.replace("DIST-", "").replace("DSP", "");
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    data.code = `DIST-${String(maxNumber + 1).padStart(3, "0")}`;
  }

  return repository.createDistributorRepo(data);
};

const updateDistributorService = async (id, data) => {
  return repository.updateDistributorRepo(id, data);
};

module.exports = {
  getDistributorsService,
  createDistributorService,
  updateDistributorService,
};
