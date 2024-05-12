exports = async function(payload, response) {
    const mongodb = context.services.get("mongodb-atlas");
    const usersCollection = mongodb.db("Badala").collection("Users");
    const http = context.http;

    let loginData;
    try {
        loginData = EJSON.parse(payload.body.text());
    } catch (e) {
        response.setStatusCode(400);
        return { error: "Invalid JSON data provided." };
    }

    if (!loginData.email || !loginData.password) {
        response.setStatusCode(400);
        return { error: "Request must include both email and password." };
    }

    try {
        const userDocument = await usersCollection.findOne({ email: loginData.email });
        if (!userDocument) {
            response.setStatusCode(404);
            return { error: "User not found." };
        }

        // Make an HTTP request to your external bcrypt service
        let verifyResponse = await http.post({
            url: "https://your-bcrypt-service.com/verify",
            headers: { "Content-Type": "application/json" },
            body: { 
                password: loginData.password, 
                hash: userDocument.password 
            },
            encodeBodyAsJSON: true
        });

        if (verifyResponse.body.text() !== "true") {
            response.setStatusCode(401);
            return { error: "Invalid credentials." };
        }

        response.setStatusCode(200);
        return { message: "Login successful!", userId: userDocument._id };

    } catch (e) {
        response.setStatusCode(500);
        return { error: "Internal server error: " + e.message };
    }
};
