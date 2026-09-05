import re

with open('src/modules/finance/finance.repository.js', 'r') as f:
    content = f.read()

content = content.replace('const createVoucherRepo = async (voucherData) => {', 'const createVoucherRepo = async (voucherData, user) => {')
content = content.replace('const getVouchersRepo = async (filters = {}) => {', 'const getVouchersRepo = async (filters = {}, user) => {')
content = content.replace('const getTrialBalanceRepo = async () => {', 'const getTrialBalanceRepo = async (user) => {')
content = content.replace('const getLedgersRepo = async () => {', 'const getLedgersRepo = async (user) => {')
content = content.replace('const getGroupsRepo = async () => {', 'const getGroupsRepo = async (user) => {')
content = content.replace('const createGroupRepo = async (data) => {', 'const createGroupRepo = async (data, user) => {')
content = content.replace('const getLedgerStatementRepo = async (ledgerId) => {', 'const getLedgerStatementRepo = async (ledgerId, user) => {')
content = content.replace('const createLedgerRepo = async (data) => {', 'const createLedgerRepo = async (data, user) => {')
content = content.replace('const createCommissionRepo = async (data) => {', 'const createCommissionRepo = async (data, user) => {')
content = content.replace('const getCommissionsRepo = async () => {', 'const getCommissionsRepo = async (user) => {')
content = content.replace('const updateCommissionStatusRepo = async (id, status) => {', 'const updateCommissionStatusRepo = async (id, status, user) => {')

helper = '''
const getWhereClause = (user) => {
  const where = {};
  if (user && user.role === "COMPANY_ADMIN") {
    where.companyId = user.companyId || 1;
  }
  return where;
};
'''
content = content.replace('const prisma = new PrismaClient();', 'const prisma = new PrismaClient();\n\n' + helper)

content = content.replace(
'''        voucherNumber,
        voucherType,
        voucherDate: voucherDate ? new Date(voucherDate) : new Date(),''',
'''        voucherNumber,
        voucherType,
        voucherDate: voucherDate ? new Date(voucherDate) : new Date(),
        companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1,''')

content = content.replace(
'''  return prisma.voucher.findMany({
    where: filters,''',
'''  return prisma.voucher.findMany({
    where: { ...filters, ...getWhereClause(user) },''')

content = content.replace(
'''  const ledgers = await prisma.accountLedger.findMany({
    include: {''',
'''  const ledgers = await prisma.accountLedger.findMany({
    where: getWhereClause(user),
    include: {''')

content = content.replace(
'''  return prisma.accountLedger.findMany({
    include: {''',
'''  return prisma.accountLedger.findMany({
    where: getWhereClause(user),
    include: {''')

content = content.replace(
'''  return prisma.accountGroup.findMany();''',
'''  return prisma.accountGroup.findMany({ where: getWhereClause(user) });''')

content = content.replace(
'''  return prisma.accountGroup.create({
    data
  });''',
'''  return prisma.accountGroup.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });''')

content = content.replace(
'''  return prisma.accountLedger.create({
    data
  });''',
'''  return prisma.accountLedger.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });''')

content = content.replace(
'''  return prisma.commission.create({
    data
  });''',
'''  return prisma.commission.create({
    data: { ...data, companyId: (user && user.role === "COMPANY_ADMIN") ? (user.companyId || 1) : 1 }
  });''')

content = content.replace(
'''  return prisma.commission.findMany({
    orderBy: { createdAt: 'desc' }
  });''',
'''  return prisma.commission.findMany({
    where: getWhereClause(user),
    orderBy: { createdAt: 'desc' }
  });''')

with open('src/modules/finance/finance.repository.js', 'w') as f:
    f.write(content)
