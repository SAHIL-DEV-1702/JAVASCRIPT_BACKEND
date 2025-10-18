
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "somenthing went wrong while genartreting access and refresh token")
    }
}


// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, username, password, } = req.body


    if ([fullname, username, password, email,].some(    // isme feild hogi to usse trim kro aur trim karne ke badd bhi empty hai to error throw 
        (field) => field.trim() === ""
    )) {
        throw new ApiError(400, "fullname,username,password,email field are require")
    }

    const existedUser = await User.findOne({

        $or: [{ username }, { email }]

    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }


    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {

        coverImageLocalPath = req.files.coverImage[0].path
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const avatarLocalPath = req.files?.avatar[0]?.path;

    console.log("avatarLocalPath:", avatarLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)


    console.log("avatar:", avatar)   /// check avatr file is uploaded or not  

    if (!avatar) {
        throw new ApiError(400, "avatar file required ")
    }

    const user = await User.create({

        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email.toLowerCase(),
        password: password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user._id).select(   // this is check for created user if user cereted then check id 
        "-password -refreshToken")                                          //// this is for remove password


    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering user")

    }

    return res.status(201).json(

        new ApiResponse(200, createdUser, "user registered sucessfully")
    )



})

//LOGIN  USER

const loginUser = asyncHandler(async (req, res) => {
    //get data from req.body
    // validate user from database using email,username
    // validate password 
    // access and refresh token
    // send secure cookies
    // send res login succes

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "email username required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)   // changes 

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
        .select(" -password -refreshToken")   // it romove field in logged in user access token

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true only in production (HTTPS)
        sameSite: "Lax" // needed for Postman / local testing
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(

            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken

            }, "user logged in successfully"),

        )

})

///LOGOUT USER

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }

    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // secure only in production
        sameSite: 'Lax' // important for local testing and Postman

    }

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, "user loged out successfully "))
})

// REFRESH ACCESS TOKEN 

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unotheroized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "REFRESH TOKEN EXPIRED")
        }


        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshTokens(user._id)
        return res
            .satus(200)
            .cookie("acceessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken },
                "ACCESS TOKEN REF SUCCESSFULLY"

            )
            )
    } catch (error) {
        throw new ApiError(401, "INVALID Refresh Token ")
    }

})

/// update password

const chanageUserCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPasword, newPassword } = req.body
    const user = await User.findById(req.user)
    isPasswordCorrect = await user.isPasswordCorrect(oldPasword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, {}, "password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.user, "current user fetches successfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullname, email, username } = req.body

    if (!(fullname || username || email)) {
        throw new ApiError("ALL FEILDS ARE REQUIRED")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            },

        }, { new: true }
    ).select('-password')

    return res.status(200)
        .json(200, new ApiResponse(200, user, "Account details upfdated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatar) {
        throw new ApiError(400, "AVATAR FILE MISSING")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading on avatar")
    }

    const newAvatrUrl = User.findByIdAndUpdate(req.user?._id,
        { avatar: avatar.url },
        { new: true })
        .select('-password')

    return res.status(200)
        .json(new ApiResponse(200, newAvatrUrl, "avatar image updated"))

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "COVER FILE MISSING")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImageLocalPath) {
        throw new ApiError(400, "COVER FILE MISSING")
    }

    const newCoverImage = await User.findByIdAndUpdate(req.user?._id,
        { coverImage: coverImage.url },
        { new: true })
        .select('-password')

    return res.status(200)
        .json(new ApiResponse(200, newCoverImage, "cover image updated"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "username missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribe",
                as: "subscribeTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribeTo"
                },
                isSubscribed: {
                    $cond: {

                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }
    return res.status(200).json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Type.ObjectId(req.user.id_)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owener",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $projetc: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }

                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owener"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200,
            user[0].watchHistory,
            "watchHistory Fetch Successfully"
        ))

})


export { registerUser, loginUser, logoutUser, refreshAccessToken, chanageUserCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory };



// if there is no use of respone or request then we set it _  underscore  like t loginUser = asyncHandler(async (req, _) => {
//                           req.send (there is no use of res so we can use _)
//
// }