# Pharma ERP MR App: Backend API Specification

This document provides a comprehensive REST API specification required to replace the AsyncStorage client-side mock storage with a real live database backend. The schemas match the JSON structures currently used in the React Native mobile app.

---

## 1. Authentication & Profile Management

### `POST /api/auth/login`
Authenticates the Medical Representative.
* **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "newpassword123"
  }
  ```
* **Response (Success 200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "employeeId": "EMP-001",
      "name": "Priya Reddy",
      "designation": "Medical Representative",
      "hq": "Hyderabad",
      "region": "Telangana",
      "zone": "South Zone",
      "manager": "Rajesh Kumar",
      "joiningDate": "01-Jan-2026",
      "mobile": "+91 98765 43210",
      "email": "admin@pharma.com",
      "address": "Hyderabad, Telangana"
    }
  }
  ```

### `POST /api/auth/change-password`
Changes the user's password.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "currentPassword": "admin123",
    "newPassword": "newsecurepassword"
  }
  ```
* **Response (Success 200 OK):**
  ```json
  { "message": "Password updated successfully." }
  ```

### `PUT /api/profile/contact`
Updates contact information.
* **Headers:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "mobile": "+91 98765 00000",
    "email": "priya.reddy@pharma.com",
    "address": "Gachibowli, Hyderabad, Telangana"
  }
  ```
* **Response (Success 200 OK):**
  ```json
  { "message": "Profile contact details updated successfully." }
  ```

---

## 2. Attendance & GPS Tracking

### `POST /api/attendance/check-in`
Logs the day start check-in with GPS location.
* **Request Body:**
  ```json
  {
    "latitude": 17.4485,
    "longitude": 78.3741,
    "address": "Hitech City, Hyderabad, Telangana",
    "checkInTime": "16-Jun-2026 09:15 AM"
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "status": "Checked In", "checkInTime": "09:15 AM" }
  ```

### `POST /api/attendance/check-out`
Logs the day end check-out with GPS location.
* **Request Body:**
  ```json
  {
    "latitude": 17.4324,
    "longitude": 78.3812,
    "address": "Madhapur, Hyderabad, Telangana",
    "checkOutTime": "16-Jun-2026 06:15 PM"
  }
  ```
* **Response (Success 200 OK):**
  ```json
  { "status": "Checked Out" }
  ```

### `GET /api/attendance/logs`
Retrieves past logs for the summary stats card.
* **Response (Success 200 OK):**
  ```json
  [
    { "date": "15-Jun-2026", "status": "Present", "checkIn": "09:02 AM", "checkOut": "06:10 PM" },
    { "date": "14-Jun-2026", "status": "Present", "checkIn": "08:55 AM", "checkOut": "06:05 PM" }
  ]
  ```

---

## 3. Customer Directory & Beats (Territories)

### `GET /api/territory/beats`
Fetches beat zones for the Beat List view.
* **Response (Success 200 OK):**
  ```json
  [
    { "id": "1", "area": "Hyderabad Central", "doctorsCount": 12, "chemistsCount": 8 },
    { "id": "2", "area": "Secunderabad A", "doctorsCount": 9, "chemistsCount": 5 }
  ]
  ```

### `GET /api/directory/customers`
Retrieves all doctors and chemists inside the MR's territory.
* **Response (Success 200 OK):**
  ```json
  {
    "doctors": [
      { "id": "d1", "name": "Dr. Ramesh Patel", "specialty": "Cardiologist", "hospital": "Apollo Hospital", "beat": "Hyderabad Central" }
    ],
    "chemists": [
      { "id": "c1", "name": "Sree Pharmacy", "contactPerson": "Sunil Kumar", "address": "Hitech City", "beat": "Hyderabad Central" }
    ]
  }
  ```

---

## 4. Visits & detaling Reports

### `POST /api/visits/doctor`
Logs a doctor visit.
* **Request Body:**
  ```json
  {
    "doctorId": "d1",
    "doctorName": "Dr. Ramesh Patel",
    "specialty": "Cardiologist",
    "detailingProducts": ["Augmentin 625", "Calpol 650"],
    "samplesGiven": [{"productName": "Calpol 650", "quantity": 10}],
    "giftsGiven": ["Pen Stand", "Desk Calendar"],
    "feedback": "Dr. Ramesh liked the new pediatric suspension sample.",
    "followUpDate": "23-Jun-2026",
    "latitude": 17.4485,
    "longitude": 78.3741
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "id": 501, "message": "Doctor visit report recorded successfully." }
  ```

### `POST /api/visits/chemist`
Logs a chemist visit (with orders).
* **Request Body:**
  ```json
  {
    "chemistId": "c1",
    "chemistName": "Sree Pharmacy",
    "productsDetailed": ["Calpol 650"],
    "orderValue": 15000,
    "followUpDate": "25-Jun-2026",
    "latitude": 17.4485,
    "longitude": 78.3741
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "id": 601, "message": "Chemist visit report recorded successfully." }
  ```

---

## 5. Order Bookings

### `POST /api/orders`
Places a direct product order.
* **Request Body:**
  ```json
  {
    "orderNumber": "ORD-90123",
    "customerType": "Chemist",
    "customerId": "c1",
    "customerName": "Sree Pharmacy",
    "items": [
      { "productId": "p1", "name": "Calpol 650", "quantity": 100, "price": 45 }
    ],
    "totalAmount": 4500,
    "dateFormatted": "16-Jun-2026 12:45 PM"
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "status": "Booked", "orderNumber": "ORD-90123" }
  ```

---

## 6. Meeting Scheduling & Approvals

### `GET /api/meetings`
Fetches scheduled group meetings.
* **Response (Success 200 OK):**
  ```json
  [
    {
      "id": 1679001122,
      "topic": "Cardiology Product Launch Presentation",
      "meetingType": "Clinical Presentation",
      "date": "2026-06-20",
      "time": "02:00 PM",
      "venue": "Apollo Hospital Hall",
      "outcome": "New Product Launch",
      "participants": "Dr. Ramesh, Dr. Sharma, Chemist Sunil",
      "attendeesCount": 3,
      "status": "Scheduled",
      "approvalStatus": "Pending Approval",
      "agenda": "Launch Detailing slides & sample distribution."
    }
  ]
  ```

### `POST /api/meetings`
Schedules a new meeting.
* **Request Body:**
  Matches fields in the `GET /api/meetings` payload.
* **Response (Success 201 Created):**
  ```json
  { "id": 1679001122, "message": "Meeting scheduled successfully." }
  ```

### `PUT /api/meetings/:id/status`
Updates meeting completion/cancellation.
* **Request Body:**
  ```json
  { "status": "Completed" } // or "Cancelled"
  ```

### `PUT /api/meetings/:id/approve` (Admin/Manager role only)
Approves or Rejects a meeting.
* **Request Body:**
  ```json
  { "approvalStatus": "Approved" } // or "Rejected"
  ```

---

## 7. Expense Claims & Leave Requests

### `POST /api/expenses`
Submits a new travel/detailing expense.
* **Request Body:**
  ```json
  {
    "type": "Travel Allowance",
    "amount": 1250,
    "date": "16-Jun-2026",
    "description": "Travel from Hitech City to Secunderabad",
    "billUrl": "https://storage.pharmaerp.com/bills/bill-4921.jpg"
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "id": 492, "status": "Pending" }
  ```

### `POST /api/leaves`
Submits a leave request.
* **Request Body:**
  ```json
  {
    "leaveType": "Sick Leave",
    "startDate": "18-Jun-2026",
    "endDate": "19-Jun-2026",
    "reason": "Medical checkup"
  }
  ```
* **Response (Success 201 Created):**
  ```json
  { "id": 204, "status": "Pending Approval" }
  ```

---

## 8. Notifications Center

### `GET /api/notifications`
Fetches user notifications.
* **Response (Success 200 OK):**
  ```json
  [
    {
      "id": 1,
      "type": "stock",
      "title": "⚠️ Augmentin 625 Stockout Alert",
      "message": "Augmentin 625 Duo stock has dropped to 0 at central warehouse.",
      "time": "Today, 10:30 AM",
      "unread": true
    }
  ]
  ```

### `PUT /api/notifications/:id/read`
Marks a single notification as read.
* **Response (Success 200 OK):**
  ```json
  { "success": true }
  ```

### `PUT /api/notifications/mark-all-read`
Marks all user notifications as read.

### `DELETE /api/notifications`
Clears notification center folder.
