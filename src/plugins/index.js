import inert from "@hapi/inert";
import vision from "@hapi/vision";
import swagger from "./swagger.js";

export default [inert, vision, { plugin: swagger }];
