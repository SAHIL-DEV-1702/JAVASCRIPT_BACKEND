import mongoose, { Schema } from "mongoose";


const tweetSchmea = new Schema({

    content: {
        type: String,
        require: true
    },

    owener: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })




export const Tweet = mongoose.model("Tweet", tweetSchmea)