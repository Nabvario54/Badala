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

    // Assuming password is already hashed if coming from a secure client-side or through an external service
    const userDocument = {
        ...userData,
        createdAt: new Date(),
        isActive: true
    };

    try {
        const insertResult = await usersCollection.insertOne(userDocument);
        if (insertResult) {
            response.setStatusCode(201);
            return { message: "User created successfully", userId: insertResult.insertedId };
        } else {
            response.setStatusCode(500);
            return { error: "Failed to create user." };
        }
    } catch (e) {
        response.setStatusCode(500);
        return { error: e.message || "Internal server error" };
    }
};
