import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            require: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owener: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
)

commentSchema.plugins(mongooseAggregatePaginate)

export const Comment = mongoose.model("comment", commentSchema)