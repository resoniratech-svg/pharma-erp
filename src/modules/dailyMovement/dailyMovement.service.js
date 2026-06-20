const repo = require(
  "./dailyMovement.repository"
);

module.exports = {
  getDailyMovementService:
    repo.getDailyMovementRepo,
};