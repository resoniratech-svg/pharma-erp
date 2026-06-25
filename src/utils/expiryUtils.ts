export const getExpiryStatus = (
  expDate: string
): "Healthy" | "Near Expiry" | "Expired" => {
  const today = new Date();

  const expiryDate = new Date(expDate);

  const diffTime =
    expiryDate.getTime() -
    today.getTime();

  const daysRemaining =
    Math.ceil(
      diffTime /
      (1000 * 60 * 60 * 24)
    );

  if (daysRemaining <= 0) {
    return "Expired";
  }

  if (daysRemaining <= 180) {
    return "Near Expiry";
  }

  return "Healthy";
};

export const getDaysToExpiry = (
  expDate: string
): number => {
  const today = new Date();

  const expiryDate = new Date(expDate);

  const diffTime =
    expiryDate.getTime() -
    today.getTime();

  return Math.ceil(
    diffTime /
    (1000 * 60 * 60 * 24)
  );
};