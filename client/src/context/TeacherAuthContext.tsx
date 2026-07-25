import { createContext, useContext, useEffect, useState } from "react";
import type { IUser } from "../assets/assets";
import api from "../configs/api";
import toast from "react-hot-toast";

interface TeacherAuthContextProps {
    isLoggedIn: boolean;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    teacher: IUser | null;
    setTeacher: (teacher: IUser | null) => void;
    login: (teacher: { email: string, password: string }) => Promise<void>;
    signUp: (teacher: { name: string, email: string, password: string }) => Promise<void>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendCode: (email: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<string>;
    resetPassword: (email: string, token: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}


const TeacherAuthContext = createContext<TeacherAuthContextProps>({
    isLoggedIn: false,
    setIsLoggedIn: () => { },
    teacher: null,
    setTeacher: () => { },
    login: async () => { },
    signUp: async () => { },
    verifyEmail: async () => { },
    resendCode: async () => { },
    forgotPassword: async () => "",
    resetPassword: async () => { },
    logout: async () => { },
})

export const TeacherAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [teacher, setTeacher] = useState<IUser | null>(null)
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    // Creates the account and sends a verification code — does NOT log
    // the teacher in. The backend deliberately doesn't start a session
    // here; that only happens after verifyEmail succeeds.
    const signUp = async ({ name, email, password }: { name: string, email: string, password: string }) => {
        try {
            const { data } = await api.post('/api/teacher-auth/register', { name, email, password });
            toast.success(data.message);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Something went wrong creating your account.';
            toast.error(message);
            throw new Error(message);
        }
    }

    const verifyEmail = async (email: string, code: string) => {
        try {
            const { data } = await api.post('/api/teacher-auth/verify-email', { email, code });
            if (data.teacher) {
                setTeacher(data.teacher as IUser)
                setIsLoggedIn(true)
            }
            toast.success(data.message);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Could not verify that code.';
            toast.error(message);
            throw new Error(message);
        }
    }

    const resendCode = async (email: string) => {
        try {
            const { data } = await api.post('/api/teacher-auth/resend-code', { email });
            toast.success(data.message);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Could not resend the code.';
            toast.error(message);
            throw new Error(message);
        }
    }

    // Returns the message so the ForgotPassword page can display it
    // directly — the backend deliberately gives the same generic
    // response whether or not the email is registered, so there's
    // nothing sensitive being returned here either way.
    const forgotPassword = async (email: string) => {
        try {
            const { data } = await api.post('/api/teacher-auth/forgot-password', { email });
            return data.message as string;
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Something went wrong. Please try again.';
            toast.error(message);
            throw new Error(message);
        }
    }

    const resetPassword = async (email: string, token: string, password: string) => {
        try {
            const { data } = await api.post('/api/teacher-auth/reset-password', { email, token, password });
            toast.success(data.message);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Could not reset your password.';
            toast.error(message);
            throw new Error(message);
        }
    }

    const login = async ({ email, password }: { email: string, password: string }) => {
        try {
            const { data } = await api.post('/api/teacher-auth/login', { email, password });
            if (data.teacher) {
                setTeacher(data.teacher as IUser)
                setIsLoggedIn(true)
            }
            toast.success(data.message)
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Invalid email or password.';
            toast.error(message);
        }

    }
    const logout = async () => {
        try {
            const { data } = await api.post('/api/teacher-auth/logout');
            setTeacher(null)
            setIsLoggedIn(false)
            toast.success(data.message)
        } catch (error) {
            console.log(error);
        }

    }
    const fetchTeacher = async () => {
        try {
            const { data } = await api.get('/api/teacher-auth/verify');
            if (data.teacher) {
                setTeacher(data.teacher as IUser)
                setIsLoggedIn(true)
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        (async () => {
            await fetchTeacher();
        })();
    }, [])

    const value = {
        teacher, setTeacher,
        isLoggedIn, setIsLoggedIn,
        signUp, verifyEmail, resendCode, forgotPassword, resetPassword, login, logout
    }

    return (
        <TeacherAuthContext.Provider value={value}>
            {children}
        </TeacherAuthContext.Provider>
    )

}

export const useTeacherAuth = () => useContext(TeacherAuthContext);