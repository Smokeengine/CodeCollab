const jwt = require("jsonwebtoken");


const auth_middleware = (req,res,next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message: "Token is missing!"
        })
    }
    try {
        const response = jwt.verify(token, process.env.secretKey);
        req.user = response;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        })
    }
    

}
module.exports = auth_middleware;