import express, { Router } from 'express';
import Authentication from '../controller/auth';

const router: Router = express.Router();

router.post('/register', async (req, res, next) => {
    try {
        await Authentication.handleRegisterUser(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        await Authentication.handleLogin(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/request-reset', async (req, res, next) => {
    try {
        await Authentication.handleRequestResetPassword(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', async (req, res, next) => {
    try {
        await Authentication.handleResetPassword(req, res);
    } catch (error) {
        next(error);
    }
});

export default router;