# BreatheWatch - Reports Feature Branch

This branch implements **user-submitted reports**, **report management**, and **status tracking** for the BreatheWatch air quality monitoring app.

---

## Features

- **User-Submitted Reports**: Users can submit reports including neighborhood, borough, type (Smoke, Dust, Odor, Other), severity (Low, Medium, High), description, timestamp, and status (Open, Reviewed, Resolved).  
- **Report Management & Status Tracking**: Users can view their own reports (`/reports/my`), all reports (`/reports`), and detailed report pages (`/reports/:id`). Status updates are performed via AJAX.  
- **Multi-User Testing**: `/test-login` allows logging in as different test users. Each user's `/reports/my` shows only their own reports.  
- **Database Seed**: `tasks/seed.js` creates multiple test users and sample reports, storing `userId` as `ObjectId` for proper user association.  

---

## Setup Instructions

1. **Checkout branch**  
   ```bash
   git checkout your-feature-branch
Install dependencies

npm install


Run MongoDB locally
Ensure MongoDB is running at mongodb://localhost:27017/.

Seed the database

node tasks/seed.js


Start the server

node app.js


Access the app at http://localhost:3000
.

Login for testing

Test user: http://localhost:3000/test-login?user=test

Alice: http://localhost:3000/test-login?user=alice

Bob: http://localhost:3000/test-login?user=bob

Project Structure
/routes
    reports.js          # Report routes and API endpoints
/views/reports
    list.handlebars
    myReports.handlebars
    view.handlebars
/tasks
    seed.js             # Database seeding for users and reports
/public/js
    reports.js          # Client-side AJAX for status updates
app.js                  # Main server entry

Notes

Session-based authentication is used for testing. Real auth logic is not implemented.

Report status updates are live via AJAX.

All reports store userId as ObjectId in MongoDB for proper association.

This branch is intended for development and multi-user testing.

Author

Koen Santos - BreatheWatch feature development branch


This is **self-contained**, so you can drop it into your branch without editing anything else.  

