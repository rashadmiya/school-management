// utils/jwt.js
export function decodeJWT(token) {
    // console.log("jwt :", token)
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch (error) {
        console.error("Invalid token", error);
        return null;
    }
}