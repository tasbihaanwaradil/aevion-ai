import { Request, Response } from 'express'
import User from '../models/User.js';
import bcrypt, { genSalt } from 'bcrypt';

//Controllers For User Registration
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        //find user by email
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' })
        }

        //Encrypt the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({ name, email, password: hashedPassword })
        await newUser.save()

        //setting user data in session
        req.session.isLoggedIn = true;
        req.session.userId = newUser._id;

        return res.json({
            message: 'Account created successfully',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }
}

//Controllers For User Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        //find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        //setting user data in session
        req.session.isLoggedIn = true;
        req.session.userId = user._id;

        return res.json({
            message: 'Login successfull',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}

//Controllers For User Logout

export const logoutUser = async (req: Request, res: Response) => {
    req.session.destroy((error: any) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ message: error.message })
        }
    })

    return res.json({ message: 'Logout successfull' })

}

//Controllers For User Verify
export const verifyUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.session;
        const user = await User.findById(userId).select('-password')

        if (!user) {
            return res.status(400).json({ message: 'Invalid user' })
        }

        return res.json({ user });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message })
    }

}


