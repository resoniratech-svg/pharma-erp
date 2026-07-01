// src/utils/attendanceValidation.ts

export const validateCheckIn = (): boolean => {
  try {
    const todayCheckin = JSON.parse(localStorage.getItem("today_checkin") || "{}");

    if (!todayCheckin.checkedIn) {
      alert("Please complete your GPS Check-In before performing this action.");
      return false;
    }

    // Optional: If you track checkOut, you can also prevent actions after checkout!
    if (todayCheckin.checkedOut) {
      alert("You have already checked out for today. You cannot log new activities.");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating attendance", error);
    alert("Unable to verify attendance. Please try checking in again.");
    return false;
  }
};