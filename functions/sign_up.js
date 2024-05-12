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

    // Basic validation
    if (!userData.email || !userData.password) {
        response.setStatusCode(400);
        return { error: "Request must include an email and password." };
    }

    // Check for existing user
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
        response.setStatusCode(409); // Conflict status
        return { error: "User with the given email already exists." };
    }

    // Password hashing
    try {
        // Utilizing MongoDB Realm's built-in crypto functions
        const hashedPassword = utils.crypto.hash(userData.password, 'sha256');

        // Prepare the user document to insert
        const userDocument = {
            ...userData,
            password: hashedPassword,
            createdAt: new Date(),
            isActive: true
        };

        // Insert the new user
        const insertResult = await usersCollection.insertOne(userDocument);
        if (insertResult.insertedId) {
            response.setStatusCode(201);
            return { message: "User created successfully", userId: insertResult.insertedId.toString() };
        } else {
            response.setStatusCode(500);
            return { error: "Failed to create user." };
        }
    } catch (e) {
        response.setStatusCode(500);
        return { error: e.message || "Internal server error" };
    }
};
