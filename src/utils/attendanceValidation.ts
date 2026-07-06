// // src/utils/attendanceValidation.ts

// export const validateCheckIn = (): boolean => {
//   try {
//     const todayCheckin = JSON.parse(localStorage.getItem("today_checkin") || "{}");

//     if (!todayCheckin.checkedIn) {
//       alert("Please complete your GPS Check-In before performing this action.");
//       return false;
//     }

//     // Optional: If you track checkOut, you can also prevent actions after checkout!
//     if (todayCheckin.checkedOut) {
//       alert("You have already checked out for today. You cannot log new activities.");
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error("Error validating attendance", error);
//     alert("Unable to verify attendance. Please try checking in again.");
//     return false;
//   }
// };

////////////////////////////////////////////////////////

// src/utils/attendanceValidation.ts

// src/utils/attendanceValidation.ts

export const validateCheckIn = (): boolean => {
  try {
    const todayCheckin = JSON.parse(localStorage.getItem("today_checkin") || "{}");

    if (!todayCheckin.checkedIn) {
      alert("Please complete your GPS Check-In before performing this action.");
      return false;
    }

    // ✅ Timezone-safe local date comparison
    const today = new Date();
    const checkinDate = todayCheckin.time ? new Date(todayCheckin.time) : null;
    
    if (!checkinDate || isNaN(checkinDate.getTime())) {
      alert("Your previous attendance records are invalid. Please check in again.");
      return false;
    }

    const isSameLocalDate = 
      checkinDate.getFullYear() === today.getFullYear() &&
      checkinDate.getMonth() === today.getMonth() &&
      checkinDate.getDate() === today.getDate();
      
    if (!isSameLocalDate) {
      alert("Your previous attendance was automatically closed because you did not check out yesterday. Please complete today's GPS Check-In before recording Doctor or Chemist visits.");
      return false;
    }

    // Prevent action after checkout
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