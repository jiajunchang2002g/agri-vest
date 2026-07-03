import { Router, type IRouter } from "express";
import healthRouter from "./health";
import campaignsRouter from "./campaigns";
import investmentsRouter from "./investments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(campaignsRouter);
router.use(investmentsRouter);

export default router;
