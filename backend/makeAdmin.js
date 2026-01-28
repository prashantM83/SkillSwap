const mongoose = require("mongoose");
const User = require("./models/User");

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI =
  "mongodb+srv://shreyanshranpariya:eEboWEKfc5dFJAqS@cluster0.n3zvoq3.mongodb.net/skillswap";

async function makeAdmin(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find and update the user
    const user = await User.findOneAndUpdate(
      { email: email },
      { isAdmin: true },
      { new: true },
    );

    if (user) {
      console.log(
        `✅ Successfully made ${user.name} (${user.email}) an admin!`,
      );
      console.log("User details:", {
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      console.log(`❌ User with email "${email}" not found`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("Usage: node makeAdmin.js <email>");
  console.log("Example: node makeAdmin.js your-email@example.com");
  process.exit(1);
}

// Run the script
makeAdmin(email);
