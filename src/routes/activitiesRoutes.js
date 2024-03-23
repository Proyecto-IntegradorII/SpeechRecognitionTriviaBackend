const express = require("express");
const router = express.Router();

const {
	makeEnrollment,
	enrolledActivities,
	createNewActivity,
	getEvents,
	getSemilleroById,
    getActivities,
	getEventById,
	cancelEnrollment
} = require("../controllers/activitiesController");

router.post("/activity/enroll", makeEnrollment);
router.post("/activity/cancel-enroll", cancelEnrollment);
router.post("/activity/list", enrolledActivities);
router.post("/activity/semillero", getSemilleroById);
router.post("/activity/event", getEventById)
router.post("/createnewactivity", createNewActivity);
router.get("/events", getEvents);
router.get("/activities", getActivities);

module.exports = router;
