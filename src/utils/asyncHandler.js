const asyncHandler = (reqHandler) => {   // THIS is using promise 
    return (req, res, next) => {

        Promise.resolve(reqHandler(req, res, next))
            .catch((err) => next(err))

    }
}

export { asyncHandler }

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
//const asyncHandeler = (fun) => async() => {}

// const asyncHandeler = (fn) => async (req, res, next) => {   // this is using try catch code
//     try {
//         await fn(req,res,next)

//     }
//     catch (error) {
//         res.status(err.code || 400).json({
//             sucess: false,
//             message:err.message
//         })
//     }

// }

