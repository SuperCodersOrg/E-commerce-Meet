const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Item = require('./models/Items');
const connectDB = require('./config/mongo');

dotenv.config();
connectDB();

const dummyItems = [
    {
        name: "Wireless Bluetooth Headphones",
        description: "Over-ear active noise cancelling headphones with 30-hour battery life and deep bass.",
        price: 2499,
        category: "Electronics",
        stock: 15,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"
    },
    {
        name: "Mechanical Gaming Keyboard",
        description: "RGB backlit mechanical keyboard with blue switches for tactile feedback and fast gaming.",
        price: 1899,
        category: "Accessories",
        stock: 25,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3"
    },
    {
        name: "Smart Fitness Watch",
        description: "Tracks heart rate, sleep, SpO2, and 20+ sports modes with bright AMOLED display.",
        price: 2999,
        category: "Wearables",
        stock: 10,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
    },
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
    ,
    {
        name: "Minimalist Laptop Backpack",
        description: "Water-resistant sleek backpack with a dedicated padded compartment for 15.6-inch laptops.",
        price: 1299,
        category: "Fashion",
        stock: 40,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62"
    }
];

const seedDatabase = async () => {
    try {

        // await Item.deleteMany({});
        
        await Item.insertMany(dummyItems);
        console.log("Dummy items inserted successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Error inserting dummy data:", error);
        mongoose.connection.close();
    }
};

seedDatabase();