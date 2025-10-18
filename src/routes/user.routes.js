import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, chanageUserCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

//Secured routes
router.route("/logout").post(verifyJWT, logoutUser)

// Refresh access token

router.route('/refreshtoken').post(refreshAccessToken)

//Change Password

router.route("/change-password").post(verifyJWT, chanageUserCurrentPassword)


// USER DETAILS

router.route("/current-user").get(verifyJWT, getCurrentUser)

// CHANGE USER DETAILS ACCOUNT INFO

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

//AVATAR UPDATE

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

//COVER IMAGE UPDATE

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

//GET CHANNEL PROFILE

router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)

//GET WAtch HISTORY

router.route("/watchhistory").get(verifyJWT, getWatchHistory)

export default router