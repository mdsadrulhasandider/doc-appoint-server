const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173', // Default React Vite local port
        'http://127.0.0.1:5173'
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(cookieParser());

// Custom Verification Middlewares
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access: No token provided' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access: Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// MongoDB Connection
const uri = process.env.DB_URI || "mongodb://127.0.0.1:27017/docappoint";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Successfully connected to MongoDB!");

        const db = client.db('docappoint');
        const doctorsCollection = db.collection('doctors');
        const bookingsCollection = db.collection('bookings');
        const usersCollection = db.collection('users');

        // Seeding Data (Auto-seed if doctors collection is empty)
        const doctorCount = await doctorsCollection.countDocuments();
        if (doctorCount === 0) {
            const seedDoctors = [
                {
                    id: "d1",
                    name: "Dr. Ayesha Rahman",
                    specialty: "Cardiologist",
                    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600",
                    experience: "10 years",
                    availability: ["09:00 AM - 12:00 PM", "04:00 PM - 07:00 PM"],
                    description: "Highly experienced cardiologist specializing in heart diseases, preventive care, and patient-centered treatment.",
                    hospital: "Labaid Cardiac Hospital",
                    location: "Dhanmondi, Dhaka",
                    fee: 800,
                    rating: 4.9
                },
                {
                    id: "d2",
                    name: "Dr. Tanjim Ahmed",
                    specialty: "Neurologist",
                    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600",
                    experience: "12 years",
                    availability: ["10:00 AM - 01:00 PM", "05:00 PM - 08:00 PM"],
                    description: "Specialized in neurodegenerative disorders, migraines, and advanced brain wave analysis.",
                    hospital: "Square Hospital",
                    location: "Panthapath, Dhaka",
                    fee: 1000,
                    rating: 4.8
                },
                {
                    id: "d3",
                    name: "Dr. Sarah Jenkins",
                    specialty: "Pediatrician",
                    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=600",
                    experience: "8 years",
                    availability: ["09:00 AM - 11:30 AM", "03:00 PM - 06:00 PM"],
                    description: "Compassionate child specialist focusing on child growth, vaccination, and newborn care.",
                    hospital: "Evercare Hospital",
                    location: "Bashundhara, Dhaka",
                    fee: 700,
                    rating: 4.9
                },
                {
                    id: "d4",
                    name: "Dr. Amit Hasan",
                    specialty: "Orthopedic Surgeon",
                    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=600",
                    experience: "15 years",
                    availability: ["11:00 AM - 02:00 PM", "06:00 PM - 09:00 PM"],
                    description: "Expert in bone fracture management, joint replacements, and sports injuries.",
                    hospital: "Popular Diagnostic Center",
                    location: "Dhanmondi, Dhaka",
                    fee: 600,
                    rating: 4.7
                },
                {
                    id: "d5",
                    name: "Dr. Nusrat Jahan",
                    specialty: "Gynecologist",
                    image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=600",
                    experience: "9 years",
                    availability: ["02:00 PM - 05:00 PM", "07:00 PM - 09:00 PM"],
                    description: "Expert in maternal-fetal medicine, prenatal counseling, and female reproductive health.",
                    hospital: "United Hospital",
                    location: "Gulshan, Dhaka",
                    fee: 900,
                    rating: 4.8
                },
                {
                    id: "d6",
                    name: "Dr. Ryan Cooper",
                    specialty: "Dermatologist",
                    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600",
                    experience: "11 years",
                    availability: ["10:00 AM - 12:30 PM", "04:30 PM - 07:30 PM"],
                    description: "Specialized in advanced skincare, clinical dermatology, acne treatments, and anti-aging therapies.",
                    hospital: "Ibn Sina Medical College Hospital",
                    location: "Kalyanpur, Dhaka",
                    fee: 1200,
                    rating: 4.6
                }
            ];
            await doctorsCollection.insertMany(seedDoctors);
            console.log("Seeded database with 6 premium doctor profiles.");
        }

        // ================= Custom Email/Password Authentication API =================
        
        // POST /register - Register a new user
        app.post('/register', async (req, res) => {
            try {
                const { name, email, photoURL, password } = req.body;
                
                if (!name || !email || !password) {
                    return res.status(400).send({ success: false, message: 'Name, email, and password are required' });
                }

                // Check password rules: min 6 chars, 1 uppercase, 1 lowercase
                const hasUppercase = /[A-Z]/.test(password);
                const hasLowercase = /[a-z]/.test(password);
                if (password.length < 6 || !hasUppercase || !hasLowercase) {
                    return res.status(400).send({ 
                        success: false, 
                        message: 'Password must be at least 6 characters, contain 1 uppercase and 1 lowercase letter.' 
                    });
                }

                // Check if user already exists
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).send({ success: false, message: 'User already exists with this email' });
                }

                // Hash the password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                const newUser = {
                    name,
                    email,
                    photoURL: photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                    password: hashedPassword,
                    createdAt: new Date()
                };

                await usersCollection.insertOne(newUser);
                res.status(201).send({ success: true, message: 'Registration successful! Please login.' });
            } catch (error) {
                res.status(500).send({ success: false, message: 'Registration failed', error: error.message });
            }
        });

        // POST /login - Log in an existing user
        app.post('/login', async (req, res) => {
            try {
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).send({ success: false, message: 'Email and password are required' });
                }

                // Check if user exists
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(400).send({ success: false, message: 'Invalid email or password' });
                }

                // Check password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).send({ success: false, message: 'Invalid email or password' });
                }

                // Sign JWT Token
                const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
                }).send({
                    success: true,
                    message: 'Login successful',
                    user: {
                        name: user.name,
                        email: user.email,
                        photoURL: user.photoURL
                    }
                });
            } catch (error) {
                res.status(500).send({ success: false, message: 'Login failed', error: error.message });
            }
        });

        // GET /users/me - Get currently logged in user info (Private)
        app.get('/users/me', verifyToken, async (req, res) => {
            try {
                const email = req.user.email;
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(404).send({ success: false, message: 'User not found' });
                }

                res.send({
                    success: true,
                    user: {
                        name: user.name,
                        email: user.email,
                        photoURL: user.photoURL
                    }
                });
            } catch (error) {
                res.status(500).send({ success: false, message: 'Failed to fetch user', error: error.message });
            }
        });

        // PUT /users/profile - Update user profile (Private)
        app.put('/users/profile', verifyToken, async (req, res) => {
            try {
                const email = req.user.email;
                const { name, photoURL } = req.body;

                if (!name || !photoURL) {
                    return res.status(400).send({ success: false, message: 'Name and Photo URL are required' });
                }

                const filter = { email };
                const updateDoc = {
                    $set: {
                        name,
                        photoURL
                    }
                };

                const result = await usersCollection.updateOne(filter, updateDoc);
                
                // Fetch the updated user profile to return to frontend
                const updatedUser = await usersCollection.findOne({ email });

                res.send({ 
                    success: true, 
                    message: 'Profile updated successfully!', 
                    modifiedCount: result.modifiedCount,
                    user: {
                        name: updatedUser.name,
                        email: updatedUser.email,
                        photoURL: updatedUser.photoURL
                    }
                });
            } catch (error) {
                res.status(500).send({ success: false, message: 'Failed to update profile', error: error.message });
            }
        });

        // ================= Social JWT Authentication API =================
        app.post('/jwt', async (req, res) => {
            const { email, name, photoURL } = req.body;
            if (!email) {
                return res.status(400).send({ success: false, message: 'Email is required' });
            }
            
            // Check if user already exists in DB, if not, create them (Auto-register social user)
            let user = await usersCollection.findOne({ email });
            if (!user) {
                user = {
                    name: name || "Social User",
                    email: email,
                    photoURL: photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                    socialAuth: true,
                    createdAt: new Date()
                };
                await usersCollection.insertOne(user);
            }

            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            }).send({ 
                success: true, 
                message: 'Social Login successful',
                user: {
                    name: user.name,
                    email: user.email,
                    photoURL: user.photoURL
                }
            });
        });

        app.post('/logout', async (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0
            }).send({ success: true, message: 'Logged out successfully' });
        });

        // ================= Doctors API =================
        // GET /doctors - fetch all doctors with Search & Sort support
        app.get('/doctors', async (req, res) => {
            try {
                const { search, sort } = req.query;
                let query = {};
                
                // Search by doctor name (case-insensitive regex)
                if (search) {
                    query.name = { $regex: search, $options: 'i' };
                }

                let sortOptions = {};
                // Sort by fee (low-to-high or high-to-low)
                if (sort) {
                    if (sort === 'fee-asc') {
                        sortOptions.fee = 1;
                    } else if (sort === 'fee-desc') {
                        sortOptions.fee = -1;
                    } else if (sort === 'rating-desc') {
                        sortOptions.rating = -1;
                    }
                }

                const result = await doctorsCollection.find(query).sort(sortOptions).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch doctors", error: error.message });
            }
        });

        // GET /doctors/top - fetch top 3 doctors for home page
        app.get('/doctors/top', async (req, res) => {
            try {
                // Fetch top 3 doctors sorted by rating
                const result = await doctorsCollection.find().sort({ rating: -1 }).limit(3).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch top doctors", error: error.message });
            }
        });

        // GET /doctors/:id - fetch single doctor details
        app.get('/doctors/:id', async (req, res) => {
            try {
                const id = req.params.id;
                let query = {};
                
                if (ObjectId.isValid(id)) {
                    query = { _id: new ObjectId(id) };
                } else {
                    query = { id: id };
                }

                const result = await doctorsCollection.findOne(query);
                if (!result) {
                    return res.status(404).send({ message: "Doctor not found" });
                }
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch doctor details", error: error.message });
            }
        });

        // ================= Bookings API (Private CRUD) =================
        // GET /bookings - get bookings for logged in user
        app.get('/bookings', verifyToken, async (req, res) => {
            try {
                const email = req.user.email;
                const result = await bookingsCollection.find({ userEmail: email }).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch bookings", error: error.message });
            }
        });

        // POST /bookings - book an appointment
        app.post('/bookings', verifyToken, async (req, res) => {
            try {
                const booking = req.body;
                
                // Enforce that booking's userEmail matches the verified JWT email
                if (booking.userEmail !== req.user.email) {
                    return res.status(403).send({ message: "Forbidden access: Email mismatch" });
                }

                const result = await bookingsCollection.insertOne(booking);
                res.status(201).send({ success: true, insertedId: result.insertedId, message: "Appointment booked successfully!" });
            } catch (error) {
                res.status(500).send({ message: "Failed to book appointment", error: error.message });
            }
        });

        // PUT /bookings/:id - update an appointment booking
        app.put('/bookings/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;
                const filter = { _id: new ObjectId(id) };
                
                // Verify the booking belongs to this user before updating
                const existingBooking = await bookingsCollection.findOne(filter);
                if (!existingBooking) {
                    return res.status(404).send({ message: "Booking not found" });
                }
                if (existingBooking.userEmail !== req.user.email) {
                    return res.status(403).send({ message: "Forbidden access: You can only edit your own bookings" });
                }

                // Prevent editing read-only fields (doctorName, userEmail, etc.) to maintain integrity
                const updateDoc = {
                    $set: {
                        patientName: updateData.patientName,
                        gender: updateData.gender,
                        phone: updateData.phone,
                        appointmentDate: updateData.appointmentDate,
                        appointmentTime: updateData.appointmentTime
                    }
                };

                const result = await bookingsCollection.updateOne(filter, updateDoc);
                res.send({ success: true, modifiedCount: result.modifiedCount, message: "Appointment updated successfully!" });
            } catch (error) {
                res.status(500).send({ message: "Failed to update appointment", error: error.message });
            }
        });

        // DELETE /bookings/:id - delete a booking
        app.delete('/bookings/:id', verifyToken, async (req, res) => {
            try {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };

                // Verify the booking belongs to this user before deleting
                const existingBooking = await bookingsCollection.findOne(filter);
                if (!existingBooking) {
                    return res.status(404).send({ message: "Booking not found" });
                }
                if (existingBooking.userEmail !== req.user.email) {
                    return res.status(403).send({ message: "Forbidden access: You can only delete your own bookings" });
                }

                const result = await bookingsCollection.deleteOne(filter);
                res.send({ success: true, deletedCount: result.deletedCount, message: "Appointment deleted successfully!" });
            } catch (error) {
                res.status(500).send({ message: "Failed to delete appointment", error: error.message });
            }
        });

    } catch (error) {
        console.error("Error running database queries:", error);
    }
}
run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
    res.send('DocAppoint server is running successfully!');
});

// Start Server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// Dev Commit: Database auto-seeding configured
// Dev Commit: JWT verification cookie validation active
// Dev Commit: Secure registration with bcryptjs
// Dev Commit: Secure CRUD for doctor bookings
// Dev Commit: Doctor directories with sorting parameters
// Dev Commit: Booking collection CRUD
