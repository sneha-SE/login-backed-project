const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const multer = require('multer');
const bcrypt = require("bcrypt");
const session = require("express-session");
const LogInCollection = require("./mongodb");

const PORT = 3000;

// Session middleware setup
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true },
  })
);


// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Save images in the uploads folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const templatePath = path.join(__dirname, "template");
const publicPath = path.join(__dirname, "public");

app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(publicPath));

// Signup page route
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Login page route
app.get("/", (req, res) => {
  res.render("login");
});

// Signup API (Register new user)
app.post("/signup", async (req, res) => {
  try {
      const { name, email, phone, address, password } = req.body;

      // Check if email or phone already exists
      const existingUser = await LogInCollection.findOne({ 
          $or: [{ email }, { phone }] 
      });

      if (existingUser) {
          return res.send("Email or Phone already registered! Please use another.");
      }

      // Hashing the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creating new user object
      const newUser = new LogInCollection({
          name,
          email,
          phone,
          address,
          password: hashedPassword
      });

      // Saving to database
      await newUser.save();

      req.session.user = { name, email, phone, address };
      res.status(201).render("home", { naming: name });

  } catch (error) {
      console.error("Signup error:", error);
      res.send("Error during signup!");
  }
});


// Login API
app.post("/login", async (req, res) => {
  try {
    const user = await LogInCollection.findOne({ name: req.body.name });

    if (!user) {
      return res.send("User not found! Please sign up.");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (isMatch) {
      req.session.user = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      };

      res.status(201).render("home", { naming: user.name });
    } else {
      res.send("Incorrect password!");
    }
  } catch (error) {
    console.error(error);
    res.send("Login failed due to an error!");
  }
});

// Home Page Route (Only accessible if logged in)
app.get("/home", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.render("home", { naming: req.session.user.name });
});

// Profile Page API (Get User Data)
app.get("/profile", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  res.render("profile", { user: req.session.user });
});

// Logout API
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error logging out");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});


//admin panel api 
const router = express.Router();

// ✅ User Update API
router.put("/update-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone, address } = req.body;

    await LogInCollection.findByIdAndUpdate(userId, { name, email, phone, address });

    res.json({ message: "User updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.get("/admin", async (req, res) => {
  try {
    // MongoDB se saare users ka data fetch karna
    const users = await LogInCollection.find();

    // Data ko "admin" template me bhejna
    res.render("admin", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Server Error");
  }
});

router.delete("/delete-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await LogInCollection.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
