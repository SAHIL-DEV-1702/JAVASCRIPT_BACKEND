import mongoose, { Schema } from 'mongoose';
import jwt from "jsonwebtoken"      // JWT is a bearer token means it like key whoever has this key who access token data 
import bcrypt from 'bcrypt'


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,
        require: true,
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "video"
        }

    ],
    refreshToken: {
        type: String,

    }


}, { timestamps: true })


userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next();   // jar password modified zala nasel tar next() execute kar asel tar else case 

    this.password = await bcrypt.hash(this.password, 10)   // he else cas aahe password modify zala asel tar punha bcrpt alo use
    next()

})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function () {

    return jwt.sign(
        {

            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}


userSchema.methods.generateRefreshToken = async function () {

    return jwt.sign(
        {

            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.REFRESH_TOKEN_EXPIRY,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}




export const User = mongoose.model("User", userSchema);