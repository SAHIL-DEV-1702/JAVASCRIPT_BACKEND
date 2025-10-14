import mongoose from mongoose

const SubscriptionSchema = mongoose.Schema({

    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }



}, {
    timestamps: true
})

export const Subscription = mongoose.modele("subcription", SubscriptionSchema)