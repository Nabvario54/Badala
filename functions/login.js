exports = async function(payload, response) {
    const mongodb = context.services.get("mongodb-atlas");
    const usersCollection = mongodb.db("Badala").collection("Users");

    let loginData;
    try {
        loginData = EJSON.parse(payload.body.text());
    } catch (e) {
        response.setStatusCode(400);
        return { error: "Invalid JSON data provided." };
    }

    // Basic validation
    if (!loginData.email || !loginData.password) {
        response.setStatusCode(400);
        return { error: "Request must include both email and password." };
    }

    try {
        // Retrieve user document
        const userDocument = await usersCollection.findOne({ email: loginData.email });
        if (!userDocument) {
            response.setStatusCode(404);
            return { error: "User not found." };
        }

        // Assuming bcrypt hashing is handled externally:
        // Check if bcrypt service is setup correctly (this part is pseudo since Realm does not support bcrypt natively)
        const bcrypt = context.services.get("bcrypt"); // This line is conceptual unless you have configured a custom service

        // Verify password - this would ideally be a call to an external service if bcrypt is not configured within Realm
        const passwordIsValid = await bcrypt.compare(loginData.password, userDocument.password);
        
        if (!passwordIsValid) {
            response.setStatusCode(401);
            return { error: "Invalid credentials." };
        }

        // Assuming successful login
        response.setStatusCode(200);
        return { message: "Login successful!", userId: userDocument._id };

    } catch (e) {
        response.setStatusCode(500);
        return { error: "Internal server error: " + e.message };
    }
};
