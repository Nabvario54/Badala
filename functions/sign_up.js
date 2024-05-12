exports = async function(payload, response) {
    const mongodb = context.services.get("mongodb-atlas");
    const usersCollection = mongodb.db("yourDatabaseName").collection("users");

    const userData = EJSON.parse(payload.body.text());

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
    const bcrypt = context.services.get("bcrypt");
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Prepare the user document to insert
    const userDocument = {
        ...userData,
        password: hashedPassword,
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
