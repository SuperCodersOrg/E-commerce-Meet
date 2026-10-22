const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Product description is required"]
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price cannot be negative"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 1,
        min: [0, "Stock cannot be negative"]
    },
    image: {
        type: String, 
        required: [true, "Product image is required"]
    }
}, { 
    timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);