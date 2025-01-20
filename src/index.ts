import express from 'express';
import Database from './Utils/database';
import authRoutes from './routes/auth';
import todoRoutes from "./routes/todo"
import { requestLogger } from './Utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.get('/', (req, res) => {
    res.send('Hello, This is the technical interview for civic voices!');
});

app.use('/api/v1/auth', authRoutes);
app.use("/api/v1/todo", todoRoutes)

async function startServer() {
    try {
        const dbResponse = await Database.connect();
        if (!dbResponse.success) {
            throw new Error(dbResponse.error || 'Failed to connect to the database');
        }

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}

startServer();