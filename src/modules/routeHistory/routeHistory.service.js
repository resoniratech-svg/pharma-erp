const repo = require(
  "./routeHistory.repository"
);

module.exports = {
  getRouteHistoryService:
    repo.getRouteHistoryRepo,
};