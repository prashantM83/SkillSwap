const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkillSwap Backend API",
      version: "1.0.0",
      description:
        "API documentation for SkillSwap platform (authentication, users, swaps, feedback, sessions, admin, messaging, notifications)",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication and account recovery" },
      { name: "Users", description: "User profile and user management" },
      { name: "Swaps", description: "Skill swap request workflows" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Invalid email or password" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "user@skillswap.com" },
            password: { type: "string", minLength: 6, example: "user123" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", minLength: 6, example: "secret123" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67d6ab12cd34ef56ab78cd90" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            isAdmin: { type: "boolean", example: false },
            isBanned: { type: "boolean", example: false },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        SwapRequest: {
          type: "object",
          required: ["toUserId", "skillOffered", "skillWanted"],
          properties: {
            toUserId: { type: "string", example: "67d6ab12cd34ef56ab78cd90" },
            skillOffered: { type: "string", example: "React" },
            skillWanted: { type: "string", example: "Node.js" },
            message: { type: "string", example: "Let's exchange skills this weekend" },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJSDoc(options);
