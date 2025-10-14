import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(

    upload.fields([

        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }

    ]),
    registerUser


)

router.route("/login").post(loginUser, () => {
    console.log("User logged in successfully")
})

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)

// refresh access token

router.route('/refreshtoken').post(refreshAccessToken)


export default router