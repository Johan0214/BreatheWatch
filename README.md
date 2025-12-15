#  BreatheWatch

BreatheWatch is a web application that helps New Yorkers make informed housing and lifestyle decisions by visualizing air quality data across the city.

Using the NYC Open Data **Air Quality** dataset from the Department of Health and Mental Hygiene (DOHMH), the app highlights pollution levels and historical trends for key indicators such as **PM₂.₅ (fine particulate matter)** and **Nitrogen Dioxide (NO₂)**.

Users can search for neighborhoods, compare air quality between locations, and explore an interactive heatmap showing pollution intensity across boroughs.

The goal of BreatheWatch is to make environmental health information easy to understand and accessible, empowering residents, renters, and homebuyers to recognize areas with elevated pollution levels and choose cleaner, healthier places to live.

---
##  Team Members
-  **Koen Santos**
-  **Rosa Taveras**
-  **Johan Jaramillo**
-  **Dhruv Bhardwaj**

##  Technologies Used

- **Backend:** Node.js, Express
- **Frontend:** Handlebars (server-rendered)
- **Database:** MongoDB
- **Data Source:** NYC Open Data (DOHMH Air Quality dataset)
- **Authentication:** Express sessions
- **Security:** Input validation and XSS protection

---

##  How to Run the Application

### 1. Install Dependencies

npm install

### 2. Ensure MongoDB is running locally:

mongodb

### 3. Seed the Database
### Populate the database with air quality and application data:

npm run seed-all

### This step fetches air quality data from NYC Open Data and prepares the database for use.

### 4. Start the Server

npm start

### 5. Access the application

http://localhost:3000

