import mongoose from 'mongoose'
const { Schema } = mongoose
mongoose.Promise = global.Promise

const ClientGofSchema = new mongoose.Schema(
    {
        reference: {
            type: String,
            required: false,
            trim: true
        },
        firsName: {
            type: String,
            required: false,
            trim: true
        },
        lastName: {
            type: String,
            required: false,
            trim: true
        },
        telephone: {
            type: Number,
            required: false,
            trim: true
        },
        email: {
            type: String,
            required: false,
            trim: true
        },
        cStatus: {
            type: Boolean,
            required: false,
            default: false,
            trim: true
        },
        User: {
            type: String,
            required: false,
            default: false,
            trim: true
        },
        Destination: {
            type: String,
            required: false,
            trim: true
        },
        EnquiryType: {
            type: String,
            required: false,
            trim: true
        },
        travelDate: {
            type: Date,
            required: false,
            trim: true
        },
        credits: {
            type: Number,
            required: false,
            trim: true
        },
        debits: {
            type: Number,
            required: false,
            trim: true
        },
        balance: {
            type: Number,
            required: false,
            trim: true
        }
    },
    {
        timestamps: true
    }
)

module.exports =
    mongoose.models.clientPst || mongoose.model('clientPst', ClientGofSchema)
