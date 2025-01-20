import express, { Router } from "express";
import verifyToken from "../middlewares/auth";
import TodoController from "../controller/todo";

const router: Router = express.Router();

router.post("/create", verifyToken, TodoController.createTodo);
router.get("/", verifyToken, TodoController.getAllTodos);
router.get("/:id", verifyToken, TodoController.getTodoById);
router.put("/:id", verifyToken, TodoController.updateTodo);
router.delete("/:id", verifyToken, TodoController.deleteTodo);

export default router;