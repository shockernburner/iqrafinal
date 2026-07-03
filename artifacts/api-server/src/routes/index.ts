import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import chatRouter from "./chat";
import chatsRouter from "./chats";
import adminRouter from "./admin";
import donateRouter from "./donate";
import voiceRouter from "./voice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(chatsRouter);
router.use(adminRouter);
router.use(donateRouter);
router.use(voiceRouter);

export default router;
