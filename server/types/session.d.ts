// import "express-session";

// // Extends express-session's SessionData with the fields the teacher auth
// // flow actually sets (see TeacherAuthRouter's Google callback). Skip this
// // file if you already have an equivalent session type declaration
// // elsewhere — having two conflicting declarations for SessionData will
// // cause a duplicate-property TS error.
// declare module "express-session" {
//   interface SessionData {
//     isLoggedIn?: boolean;
//     teacherId?: string;
//   }
// }