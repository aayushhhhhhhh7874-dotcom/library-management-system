const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const openApiPath = path.join(__dirname, "../../docs/openapi.yaml");
const openApiDocument = YAML.load(openApiPath);

module.exports = {
  swaggerUi,
  openApiDocument
};
