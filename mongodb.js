const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/loginProfile", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected successfully!');
})
.catch((e) => {
    console.error('Failed to connect to MongoDB:', e.message);
});

const logInSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^[0-9]{10,15}$/ // Supports 10-15 digit phone numbers
    },
    address: {
       type: String,
       required: true 
    },
    profileImage: {
        type: String, // Store the file path
        default: "/uploads/default.png", // Default image if no upload
      },
});

const LogInCollection = mongoose.model('LogInCollection', logInSchema);

module.exports = LogInCollection;
