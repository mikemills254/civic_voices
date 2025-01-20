"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const todo_1 = require("../models/todo");
const mongoose_1 = __importDefault(require("mongoose"));
class TodoController {
}
_a = TodoController;
TodoController.createTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { title, description, category = 'other' } = req.body;
    const customReq = req;
    if (!title) {
        res.status(400).json({
            message: 'Please provide a title',
        });
        return;
    }
    const userId = (_b = customReq.token) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        res.status(401).json({
            message: 'Unauthorized: User not logged in',
        });
        return;
    }
    try {
        const newTodo = new todo_1.Todo({
            title,
            description,
            category,
            owner: userId,
        });
        const savedTodo = yield newTodo.save();
        res.status(201).json({
            message: 'Todo created successfully',
            todo: savedTodo,
        });
    }
    catch (error) {
        console.error('Error creating Todo:', error);
        res.status(500).json({
            message: 'Error creating Todo',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
TodoController.getAllTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const customReq = req;
    const userId = (_b = customReq.token) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        res.status(401).json({
            message: 'Unauthorized: User not logged in',
        });
        return;
    }
    try {
        const todos = yield todo_1.Todo.find({ owner: userId }).sort({ createdAt: -1 });
        res.status(200).json({
            message: 'Todos retrieved successfully',
            todos,
        });
    }
    catch (error) {
        console.error('Error retrieving Todos:', error);
        res.status(500).json({
            message: 'Error retrieving Todos',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
TodoController.getTodoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { id } = req.params;
    const customReq = req;
    const userId = (_b = customReq.token) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        res.status(401).json({
            message: 'Unauthorized: User not logged in',
        });
        return;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({
            message: 'Invalid todo ID',
        });
        return;
    }
    try {
        const todo = yield todo_1.Todo.findOne({ _id: id, owner: userId });
        if (!todo) {
            res.status(404).json({
                message: 'Todo not found',
            });
            return;
        }
        res.status(200).json({
            message: 'Todo retrieved successfully',
            todo,
        });
    }
    catch (error) {
        console.error('Error retrieving Todo:', error);
        res.status(500).json({
            message: 'Error retrieving Todo',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
TodoController.updateTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { id } = req.params;
    const { title, description, category, completed } = req.body;
    const customReq = req;
    const userId = (_b = customReq.token) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        res.status(401).json({
            message: 'Unauthorized: User not logged in',
        });
        return;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({
            message: 'Invalid todo ID',
        });
        return;
    }
    try {
        const updatedTodo = yield todo_1.Todo.findOneAndUpdate({ _id: id, owner: userId }, {
            title,
            description,
            category,
            completed,
            updatedAt: new Date()
        }, { new: true, runValidators: true });
        if (!updatedTodo) {
            res.status(404).json({
                message: 'Todo not found',
            });
            return;
        }
        res.status(200).json({
            message: 'Todo updated successfully',
            todo: updatedTodo,
        });
    }
    catch (error) {
        console.error('Error updating Todo:', error);
        res.status(500).json({
            message: 'Error updating Todo',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
TodoController.deleteTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { id } = req.params;
    const customReq = req;
    const userId = (_b = customReq.token) === null || _b === void 0 ? void 0 : _b.userId;
    if (!userId) {
        res.status(401).json({
            message: 'Unauthorized: User not logged in',
        });
        return;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({
            message: 'Invalid todo ID',
        });
        return;
    }
    try {
        const deletedTodo = yield todo_1.Todo.findOneAndDelete({ _id: id, owner: userId });
        if (!deletedTodo) {
            res.status(404).json({
                message: 'Todo not found',
            });
            return;
        }
        res.status(200).json({
            message: 'Todo deleted successfully',
            todo: deletedTodo,
        });
    }
    catch (error) {
        console.error('Error deleting Todo:', error);
        res.status(500).json({
            message: 'Error deleting Todo',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = TodoController;
