const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const { Schema } = mongoose;
const Port = 8000;

// Create a schema for store information
const storeInfoSchema = new Schema({
    address: String,
    gst: String,
    logo: String,
    storeTimings: String
});

// Create a schema for product inventory
const productSchema = new Schema({
    category: String,
    subCategory: String,
    productName: String,
    MRP: Number,
    SP: Number,
    QTY: Number,
    images: [String]
});

// Create a schema for the seller information
const sellerSchema = new Schema({
    email: String,
    businessName: String,
    password: String,
    storeInfo: storeInfoSchema,
    products: [productSchema]
});

// Create a model for the seller
const Seller = mongoose.model('Seller', sellerSchema);

// Set up body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/sellerDashboard')
    .then(() => console.log(' Succesfully connected to MongoDB !!!'))
    .catch(err => console.error('Could not connect to MongoDB ...'));

// POST request for signup form
app.post('/signup', async (req, res) => {
    try {
        // Validate the request body
        const { email, businessName, password, confirmPassword } = req.body;
        if (!email || !businessName || !password || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        
        // Create a new seller
        const seller = new Seller({
            email,
            businessName,
            password
        });

        // Save the seller to the database
        await seller.save();
        return res.status(200).json({ message: 'Signup successful' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// GET request for a seller's inventory
app.get('/inventory/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: `Seller with ID ${sellerId} not found` });
        }

        // Send the seller's product inventory as a response
        return res.status(200).json({
            data:{
            seller,
            message:`Here is the inventory...`
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// POST request for adding product to a seller's inventory
app.post('/inventory/:sellerId/products', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { category, subCategory, productName, MRP, SP, QTY, images } = req.body;
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({ message: `Seller with ID ${sellerId} not found` });
        }

        // Add the new product to the seller's inventory
        seller.products.push({
            category,
            subCategory,
            productName,
            MRP,
            SP,
            QTY,
            images
        });

        // Save the updated seller to the database
        await seller.save();
        return res.status(200).json({ message: 'Product added successfully !!!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(Port, () => console.log(`Server is running on port: ${Port}`));
