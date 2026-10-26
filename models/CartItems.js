const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    ObjectId: {
        type: Object,
        required: [true, "Product name is required"],
        trim: true
    },
    IdArray: {
        type: Array,
        required: [true, "Product description is required"]
    },
  
 
}, { 
    timestamps: true
});

module.exports = mongoose.model('CartItem', CartItemSchema);