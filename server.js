const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/userRoutes");
const appRouter = require("./routes/appRoute");
const mobsfRouter = require("./routes/mobsfRoute");
const validationRouter = require("./routes/validationRoute");
const swaggerJsdoc = require("swagger-jsdoc");  // Corrected variable name
const swaggerUi = require("swagger-ui-express");  // Corrected variable name

const app = express();
const port = 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

app.use(bodyParser.json({ limit: '50mb' }));

app.use(fileUpload());
app.use("/auth", authRoutes);
app.use("/app", appRouter);
app.use("/uploadapp", appRouter);
app.use("/mobsf", mobsfRouter)
app.use("/validation",validationRouter);

const options1 = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Appstore App submission API doc",
      version: "1.0",
      description: "This is a simple api for streamlining app submission process made with express",
      contact: {
        name: "Adil Muhammed Y",
        email: "adil.muhammed@visteon.com",
      }
    },
    servers: [
      {
        url: `http://localhost:${port}/`,
      },
    ],
  },
  apis: ["./routes/*.js"],
}

const specs = swaggerJsdoc(options1)
app.use(
  "/api_docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
