const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ADOS - American Dream Operating System",
            version: "1.0.0",
            description: "API documentation",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
            },
        ],
    },

    apis: ["./modules/*/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;