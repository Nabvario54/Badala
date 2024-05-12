exports = async function(payload, response) {
    const mongodb = context.services.get("mongodb-atlas");
    const usersCollection = mongodb.db("Badala").collection("Users");

    let userData;
    try {
        userData = EJSON.parse(payload.body.text());
    } catch (e) {
        response.setStatusCode(400);
        return { error: "Invalid JSON data provided." };
    }

    // Validate input
    if (!userData.email || !userData.password) {
        response.setStatusCode(400);
        return { error: "Request must include both an email and password." };
    }

    // Find user by email
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (!existingUser) {
        response.setStatusCode(404);
        return { error: "User not found." };
    }

    // Check hashed password
    const hashedPasswordInput = utils.crypto.hash("sha256", userData.password);
    if (hashedPasswordInput !== existingUser.password) {
        response.setStatusCode(401); // Unauthorized status
        return { error: "Invalid password." };
    }

    // Successful login
    response.setStatusCode(200);
    return {
        message: "Login successful",
        userId: existingUser._id
    };
};
