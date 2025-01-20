"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const todo_1 = __importDefault(require("../controller/todo"));
const router = express_1.default.Router();
router.post("/create", auth_1.default, todo_1.default.createTodo);
router.get("/", auth_1.default, todo_1.default.getAllTodos);
router.get("/:id", auth_1.default, todo_1.default.getTodoById);
router.put("/:id", auth_1.default, todo_1.default.updateTodo);
router.delete("/:id", auth_1.default, todo_1.default.deleteTodo);
exports.default = router;
