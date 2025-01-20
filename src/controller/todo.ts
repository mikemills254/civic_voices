import { Request, Response } from 'express';
import { Todo } from '../models/todo';
import { CustomRequest } from '../Utils/utils';
import mongoose from 'mongoose';

class TodoController {
    static createTodo = async (req: Request, res: Response): Promise<void> => {
        const { title, description, category = 'other' } = req.body;
        const customReq = req as CustomRequest;

        if (!title) {
            res.status(400).json({
                message: 'Please provide a title',
            });
            return;
        }

        const userId = customReq.token?.userId;
        if (!userId) {
            res.status(401).json({
                message: 'Unauthorized: User not logged in',
            });
            return;
        }

        try {
            const newTodo = new Todo({
                title,
                description,
                category,
                owner: userId,
            });

            const savedTodo = await newTodo.save();

            res.status(201).json({
                message: 'Todo created successfully',
                todo: savedTodo,
            });
        } catch (error) {
            console.error('Error creating Todo:', error);
            res.status(500).json({
                message: 'Error creating Todo',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    static getAllTodos = async (req: Request, res: Response): Promise<void> => {
        const customReq = req as CustomRequest;
        const userId = customReq.token?.userId;

        if (!userId) {
            res.status(401).json({
                message: 'Unauthorized: User not logged in',
            });
            return;
        }

        try {
            const todos = await Todo.find({ owner: userId }).sort({ createdAt: -1 });
            res.status(200).json({
                message: 'Todos retrieved successfully',
                todos,
            });
        } catch (error) {
            console.error('Error retrieving Todos:', error);
            res.status(500).json({
                message: 'Error retrieving Todos',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    static getTodoById = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const customReq = req as CustomRequest;
        const userId = customReq.token?.userId;

        if (!userId) {
            res.status(401).json({
                message: 'Unauthorized: User not logged in',
            });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: 'Invalid todo ID',
            });
            return;
        }

        try {
            const todo = await Todo.findOne({ _id: id, owner: userId });
            
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
        } catch (error) {
            console.error('Error retrieving Todo:', error);
            res.status(500).json({
                message: 'Error retrieving Todo',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    static updateTodo = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { title, description, category, completed } = req.body;
        const customReq = req as CustomRequest;
        const userId = customReq.token?.userId;

        if (!userId) {
            res.status(401).json({
                message: 'Unauthorized: User not logged in',
            });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: 'Invalid todo ID',
            });
            return;
        }

        try {
            const updatedTodo = await Todo.findOneAndUpdate(
                { _id: id, owner: userId },
                { 
                    title, 
                    description, 
                    category,
                    completed,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );

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
        } catch (error) {
            console.error('Error updating Todo:', error);
            res.status(500).json({
                message: 'Error updating Todo',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    static deleteTodo = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const customReq = req as CustomRequest;
        const userId = customReq.token?.userId;

        if (!userId) {
            res.status(401).json({
                message: 'Unauthorized: User not logged in',
            });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: 'Invalid todo ID',
            });
            return;
        }

        try {
            const deletedTodo = await Todo.findOneAndDelete({ _id: id, owner: userId });

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
        } catch (error) {
            console.error('Error deleting Todo:', error);
            res.status(500).json({
                message: 'Error deleting Todo',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
}

export default TodoController;