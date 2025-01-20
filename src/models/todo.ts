import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './user';

type TodoStatus = 'pending' | 'in-progress' | 'completed';
type TodoCategory = 'school' | 'work' | 'family' | 'personal' | 'shopping' | 'health' | 'other';

export interface ITodo extends Document {
    title: string;
    description?: string;
    status: TodoStatus;
    createdAt: Date;
    updatedAt: Date;
    category: TodoCategory;
    owner: mongoose.Types.ObjectId | IUser;
}

const TodoSchema: Schema = new Schema<ITodo>({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: { 
        type: String, 
        enum: ['school', 'work', 'family', 'personal', 'shopping', 'health', 'other'], 
        default: 'other',
        required: true 
    },
},{
    timestamps: true,
});

export const Todo: Model<ITodo> = mongoose.model<ITodo>('Todo', TodoSchema);
