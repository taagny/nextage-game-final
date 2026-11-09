import { register } from "node:module"

register("./service-loader.mjs", import.meta.url)
