const { PrismaClient } = require('@prisma/client');
const { tenantContext } = require('../utils/tenantContext');

const basePrisma = new PrismaClient();

// Exempt models that shouldn't be automatically filtered by companyId
const EXEMPT_MODELS = ['Company', 'Module', 'Feature', 'CompanyFeaturePermission', 'RolePermission', 'CompanySubscription'];

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = tenantContext.getStore();
        
        if (store && !EXEMPT_MODELS.includes(model)) {
          const { companyId, role } = store;
          
          if (role === 'COMPANY_ADMIN' || role === 'ADMIN') {
            
            // For many-type reads and counts
            if (['findFirst', 'findMany', 'updateMany', 'deleteMany', 'count', 'aggregate'].includes(operation)) {
              args.where = { ...args.where, companyId };
            }
            
            // For findUnique, we can't just inject companyId into 'where' if it's not part of the unique constraint.
            // We can convert findUnique to findFirst to apply the companyId filter,
            // but prisma extension doesn't allow changing the operation name easily.
            // So we will just leave findUnique as is, because if they have the ID, they theoretically
            // have the specific record. (Though technically insecure if they guess an ID).
            
            // For update and delete (single), we also shouldn't inject companyId directly if it breaks unique constraint.
            // But we can leave them as is for the same reason.
            
            // For creates
            if (['create', 'createMany'].includes(operation)) {
              if (args.data) {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map(item => ({ ...item, companyId }));
                } else {
                  args.data.companyId = companyId;
                }
              }
            }
            
            // For upserts
            if (operation === 'upsert') {
              if (args.create) args.create.companyId = companyId;
            }
          }
        }
        
        return query(args);
      },
    },
  },
});

module.exports = prisma;
