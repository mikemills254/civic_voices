import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt"

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    profile?: string;
    lastLogin: Date;
    resetCode?: string;
    resetCodeExpiry?: Date;
    loginAttempts?: number;
    lockUntil?: Date;
    verificationToken?: string;
    verificationExpiry?: Date;
    isLocked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserDocument extends IUser, IUserMethods, Document {}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
    {
        username: {
            type: String,
            required: [true, "Please provide a username"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters long"],
            maxlength: [30, "Username cannot exceed 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
                "Please enter a valid email address",
            ],
            index: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            select: false,
            validate: {
                validator: function (value: string) {
                    if (this.isModified("password")) {
                        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
                        return passwordRegex.test(value);
                    }
                    return true;
                },
                message:
                    "Password must include 8-16 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character",
            },
        },        
        profile: {
            type: String,
            required: false,
            trim: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        resetCode: {
            type: String,
            select: false,
        },
        resetCodeExpiry: {
            type: Date,
            select: false,
        },
        loginAttempts: {
            type: Number,
            required: true,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.resetCode;
                delete ret.resetCodeExpiry;
                delete ret.verificationToken;
                delete ret.verificationExpiry;
                delete ret.__v;
                return ret;
            },
        },
    }
);

userSchema.index({ email: 1, verified: 1 });
userSchema.index({ resetCodeExpiry: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ verificationExpiry: 1 }, { expireAfterSeconds: 0 });

userSchema.virtual("isLocked").get(function (this: IUserDocument) {
    return !!(
        this.lockUntil && new Date(this.lockUntil).getTime() > Date.now()
    );
});

userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    try {
        console.log("candidatepassword", candidatePassword)
        console.log("user password", this.password)
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.log("error", error)
        throw new Error("Error comparing passwords");
    }
};

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export { User };