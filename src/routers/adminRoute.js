
import express from 'express'
import { verifyAdmin } from '../middleware/authMidleware.js';
import { loginAdmin, getAdminProfile, } from '../controllers/authAdmin.controller.js'
import { changeActiveUser, getAllUser, getAllPost, countData, hidePost }
    from '../controllers/admin.controller.js'
import { deletePost }
    from '../controllers/post.controller.js';
const router = express.Router();
/**
 * 
 * @param {*} app : express app
 */

const adminRouter = (app) => {



    //auth
    router.post("/auth/login", loginAdmin)
    router.get('/auth/profile', verifyAdmin, getAdminProfile)

    // get data
    router.get('/dashboard/data', countData)
    // management user
    router.get("/user/all", verifyAdmin, getAllUser)
    router.put("/user/update/:id", verifyAdmin, changeActiveUser)


    // management post 

    router.get("/post/all", getAllPost)
    router.delete("/post/:id", deletePost)
    router.put("/post/:id", verifyAdmin, hidePost)

    return app.use("/api/v1/admin", router);
}

export default adminRouter;


