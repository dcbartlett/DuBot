/**
 * Module dependencies.
 */
import * as modules from "./modules";

Object.keys(modules).forEach((moduleName) => {
  const module = new modules[moduleName];
});