# ⚙️ DocAppoint Server — Secure RESTful API Backend

Welcome to the **DocAppoint Backend Server**, a fast, secure, and production-ready Express.js RESTful API. This server handles data modeling, user authentication with bcrypt cryptographic hashing, secure HttpOnly cookie session management, dynamic CORS configuration, and cloud database storage via MongoDB Atlas.

🔗 **Client GitHub Repo:** [https://github.com/mdsadrulhasandider/doc-appoint-client](https://github.com/mdsadrulhasandider/doc-appoint-client)  
🔗 **Server GitHub Repo:** [https://github.com/mdsadrulhasandider/doc-appoint-server](https://github.com/mdsadrulhasandider/doc-appoint-server)  
🌐 **Live Website Link:** `[YOUR_VERCEL_LIVE_SITE_URL_HERE]` *(e.g., https://docappoint-client.vercel.app)*

---

## 🔒 Security & Core Backend Features

- **🔐 Robust JWT Cookie Authentication:** Issues secure JSON Web Tokens (JWT) upon login/registration. Tokens are stored in the user's browser via **`HttpOnly` and `SameSite: None` secure cookies** to prevent XSS (Cross-Site Scripting) and CSRF (Cross-Site Request Forgery) attacks.
- **🛡️ Secure Cryptographic Password Hashing:** Uses **`bcryptjs`** with a salt round of 10 to securely hash passwords before storing them in the MongoDB database, protecting user credentials.
- **🌐 Dynamic, Environment-Aware CORS:** Configured with robust, origin-adaptive Cross-Origin Resource Sharing (CORS) that automatically allows local development ports (like `localhost:5173`/`5174`) as well as production live client domains.
- **📂 Real-Time MongoDB Database Integration:** Connects seamlessly with MongoDB Atlas via Mongoose. Automatically populates doctor directory lists, creates new user profiles, handles custom user-review logs, and manages clinical appointments under transactional integrity.

---

## 🛠️ Technology Stack Used

*   **Node.js** (Fast, highly scalable asynchronous JavaScript runtime)
*   **Express.js** (Minimal and flexible web application framework for APIs)
*   **MongoDB & Mongoose** (Cloud-native NoSQL database modeling)
*   **jsonwebtoken** (Secure token generation and expiration validation)
*   **cookie-parser** (Handling secure cross-origin browser cookies)
*   **bcryptjs** (Advanced cryptographic password hashing)
*   **CORS** (Secure, origin-adaptive route security)

---

## 📡 REST API Endpoints Overview

### **Auth Endpoints:**
*   `POST /register` — Register a new patient (hashes password and signs JWT cookie session)
*   `POST /login` — Authenticate credentials (issues session cookie)
*   `GET /users/me` — Retrieve logged-in session profile (private endpoint)
*   `POST /logout` — Expire and clear HTTP session cookies
*   `POST /jwt` — Social Google/GitHub secure token handshake and automated DB user matching

### **Doctor Directory Endpoints:**
*   `GET /doctors` — Retrieve clinical directories (supports live keyword search queries and fee-based sorting)
*   `GET /doctors/top` — Fetch top-rated specialists (highly popular frontpage catalog)
*   `GET /doctors/:id` — Retrieve a comprehensive profile of a specific doctor by ID

### **Appointment Booking Endpoints (Private/Protected):**
*   `GET /bookings` — Fetch active doctor checkups booked by the logged-in user (private route)
*   `POST /bookings` — Book a new appointment slot for a doctor (private route)
*   `PUT /bookings/:id` — Update patient or schedule details on an existing booking (private route)
*   `DELETE /bookings/:id` — Delete / cancel an active appointment (private route)

---

## 🚀 Easy Local Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/mdsadrulhasandider/doc-appoint-server.git
   cd doc-appoint-server
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables (`.env`):**
   Create a `.env` file in the root of the server directory:
   ```env
   PORT=5000
   DB_URI=mongodb://127.0.0.1:27017/docappoint
   JWT_SECRET=MySuperSecretJWT123!
   ```
4. **Run Server in Development Mode:**
   ```bash
   npm start
   ```
