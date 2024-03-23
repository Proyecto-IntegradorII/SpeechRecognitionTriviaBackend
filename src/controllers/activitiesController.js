/**
 * Controladores de actividades
 */

const { supabase } = require("../configs/databaseConfig");

// REALIZAR INSCRIPCION DE UN USUARIO A UNA ACTIVIDAD (GRUPO O EVENTO)
async function makeEnrollment(req, res) {
	try {
		const { user_id, activity_id, activity_type } = req.body;

		// Si es un grupo, buscar la informacion del grupo en la base de datos
		if (activity_type == "group") {
			const { data: groupData, error: errorData } = await supabase
				.from("groups")
				.select("*")
				.eq("group_id", activity_id)
				.single();

			const slots = groupData.slots;

			const newSlots = groupData.available_slots

			const { data: enrollmentsData, error: errorEnrollments } = await supabase
				.from("enrollments")
				.select("count", { count: "exact" })
				.eq("group_id", activity_id);

			const slots_taken = enrollmentsData[0].count;
			const available_slots = slots - slots_taken;

			if (available_slots > 0) {
				const { data: newEnrollment, error: errorNewEnrollment } = await supabase
					.from("enrollments")
					.insert([
						{
							user_id: user_id,
							group_id: activity_id,
							activity_type: "group",
						},
					]);


				const { data: updateSlots, error: errorUpdateSlots } = await supabase
					.from("groups")
					.update({ available_slots: newSlots - 1 }) // Resta 1 al valor actual
					.eq("group_id", activity_id);


				res.status(200).json({ message: "Successfully enrolled" });
			} else {
				res.status(500).json({ message: "There are no free slots" });
			}
		} else if (activity_type == "event") {

			const { data: groupData, error: errorData } = await supabase
				.from("events")
				.select("*")
				.eq("event_id", activity_id)
				.single();

			const slots = groupData.slots;

			const newSlots = groupData.available_slots

			const { data: enrollmentsData, error: errorEnrollments } = await supabase
				.from("enrollments")
				.select("count", { count: "exact" })
				.eq("event_id", activity_id);

			const slots_taken = enrollmentsData[0].count;
			const available_slots = slots - slots_taken;

			if (available_slots > 0) {
				const { data: newEnrollment, error: errorNewEnrollment } = await supabase
					.from("enrollments")
					.insert([
						{
							user_id: user_id,
							event_id: activity_id,
							activity_type: "event",
						},
					]);


				const { data: updateSlots, error: errorUpdateSlots } = await supabase
					.from("events")
					.update({ available_slots: newSlots - 1}) // Resta 1 al valor actual
					.eq("event_id", activity_id);


				res.status(200).json({ message: "Successfully enrolled" });
			} else {
				res.status(500).json({ message: "There are no free slots" });
			}

		} else {
			res.status(500).json({ message: "Activity type not provided" });
		}
	} catch (error) {
		res.status(500).json({ error: `${error}` });
	}
}

async function cancelEnrollment(req, res) {
	try {
	  const { user_id, activity_id, activity_type } = req.body;
  
	  let activityTable;
	  let enrollmentColumn;
	  let activityColumn;
  
	  if (activity_type === "group") {
		activityTable = "groups";
		enrollmentColumn = "group_id";
		activityColumn = "available_slots";
	  } else if (activity_type === "event") {
		activityTable = "events";
		enrollmentColumn = "event_id";
		activityColumn = "available_slots";
	  } else {
		res.status(500).json({ message: "Invalid activity type" });
		return;
	  }
  
	  // Obtener información de la inscripción
	  const { data: enrollmentData, error: errorEnrollment } = await supabase
		.from("enrollments")
		.delete()
		.eq("user_id", user_id)
		.eq(enrollmentColumn, activity_id)
		.eq("activity_type", activity_type)
		.single();
  
	  // Obtener información de la actividad
	  const { data: activityData, error: errorActivity } = await supabase
		.from(activityTable)
		.select("*")
		.eq(enrollmentColumn, activity_id)
		.single();
  
	  // Actualizar cupos disponibles
	  const updatedSlots = activityData[activityColumn] + 1;
  
	  const { data: updateActivity, error: errorUpdateActivity } = await supabase
		.from(activityTable)
		.update({ [activityColumn]: updatedSlots })
		.eq(enrollmentColumn, activity_id);
  
	  if (errorUpdateActivity) {
		res.status(500).json({ message: "Failed to update activity slots" });
		return;
	  }
  
	  res.status(200).json({ message: "Enrollment canceled successfully" });
	} catch (error) {
	  res.status(500).json({ error: `${error}` });
	}
  }
  

async function createNewActivity(req, res) {
	try {
		const {
			type_of_activity,
			event_name,
			group_name,
			event_description,
			group_description,
			available_slots,
			slots,
			creator_id,
			monday_start,
			monday_end,
			tuesday_start,
			tuesday_end,
			wednesday_start,
			wednesday_end,
			thursday_start,
			thursday_end,
			friday_start,
			friday_end,
			saturday_start,
			saturday_end,
		} = req.body;
		console.log(req.body);
		if (type_of_activity == "Semillero") {
			const { data, error } = await supabase.from("groups").insert([
				{
					group_name: group_name,
					group_description: group_description,
					available_slots: available_slots,
					slots: slots,
					creator_id: creator_id,
					monday_start: monday_start,
					monday_end: monday_end,
					tuesday_start: tuesday_start,
					tuesday_end: tuesday_end,
					wednesday_start: wednesday_start,
					wednesday_end: wednesday_end,
					thursday_start: thursday_start,
					thursday_end: thursday_end,
					friday_start: friday_start,
					friday_end: friday_end,
					saturday_start: saturday_start,
					saturday_end: saturday_end,
					photo:
						"https://movil.colombiaaprende.edu.co/sites/default/files/files_public/aprender_en_casa/Plazacirculo_amarillo.png",
				},
			]);
			if (error) {
				res.status(500).json({ error: error.message });
				console.log(error);
			}
		} else if (type_of_activity == "Evento") {
			const { data, error } = await supabase.from("events").insert([
				{
					event_name: event_name,
					event_description: event_description,
					available_slots: available_slots,
					slots: slots,
					creator_id: creator_id,
					monday_start: monday_start,
					monday_end: monday_end,
					tuesday_start: tuesday_start,
					tuesday_end: tuesday_end,
					wednesday_start: wednesday_start,
					wednesday_end: wednesday_end,
					thursday_start: thursday_start,
					thursday_end: thursday_end,
					friday_start: friday_start,
					friday_end: friday_end,
					saturday_start: saturday_start,
					saturday_end: saturday_end,
					photo:
						"https://movil.colombiaaprende.edu.co/sites/default/files/files_public/aprender_en_casa/Plazacirculo_amarillo.png",
				},
			]);
			if (error) {
				res.status(500).json({ error: error.message });
			}
		}
	} catch { }
}

// OBTENER ACTIVIDADES INSCRITAS DE UN USUARIO
async function enrolledActivities(req, res) {
	try {
		const { user_id } = req.body;

		console.log("UserID: " + user_id);

		//OBTENER ACTIVIDADES INSCRITAS
		const { data: dataList, error: errorList } = await supabase
			.from("enrollments")
			.select("*")
			.eq("user_id", user_id);

		console.log("List: " + dataList);

		const activities = [];

		//OBTENER DATOS ADICIONALES DE CADA ACTIVIDAD INSCRITA
		for (const enrollment of dataList) {
			if (enrollment.activity_type == "group" && enrollment.group_id) {
				const { data: groupData, error: groupError } = await supabase
					.from("groups")
					.select("*")
					.eq("group_id", enrollment.group_id)
					.single();

				if (groupData) {
					activities.push({
						group_id: enrollment.group_id,
						group_name: groupData.group_name,
						group_description: groupData.group_description,
						group_photo: groupData.photo,
					});
				}
			} else if (enrollment.activity_type == "event" && enrollment.event_id) {
				const { data: eventData, error: eventError } = await supabase
					.from("events")
					.select("*")
					.eq("event_id", enrollment.event_id)
					.single();

				if (eventData) {
					activities.push({
						event_id: enrollment.event_id,
						event_name: eventData.event_name,
						event_description: eventData.event_description,
						event_photo: eventData.photo,
					});
				}
			}
		}

		console.log("Activities: " + activities);

		res.status(200).json({ message: "Activities sent", activities: activities });
	} catch (error) {
		res.status(500).json({ error: `${error}` });
		console.log("Error: " + error);
	}
}

async function getEvents(req, res) {
	try {
		const { data: events, error: eventsError } = await supabase
			.from("events")
			.select("event_id, event_name, photo");

		if (eventsError) {
			res.status(500).json({ error: eventsError });
			console.log(eventsError);
		} else {
			console.log("Lista de eventos:", JSON.stringify(events)); // Ver como cadena JSON en consola
			console.log("Events: " + events);

			res.status(200).json({ message: "Events sent", events: events });
		}
	} catch (error) {
		res.status(500).json({ error: `${error}` });
		console.log("Error: " + error);
	}
}

async function getSemilleroById(req, res) {
	try {
		const { semillero_id, user_id } = req.body;

		// Buscar si el semillero existe
		const { data: semilleroData, error: semilleroError } = await supabase
			.from("groups")
			.select("*")
			.eq("group_id", semillero_id)
			.single();

		// Si el semillero no existe
		if (semilleroError) {
			throw new Error("Group does not exist");
		}

		// Obtener la información del semillero
		const {
			group_name,
			group_description,
			slots,
			available_slots,
			monday_start,
			monday_end,
			tuesday_start,
			tuesday_end,
			wednesday_start,
			wednesday_end,
			thursday_start,
			thursday_end,
			friday_start,
			friday_end,
			saturday_start,
			saturday_end,
			photo,
			place,
		} = semilleroData;

		// Verificar si el usuario está inscrito en el semillero
		const { data: enrollmentData, error: enrollmentError } = await supabase
			.from("enrollments")
			.select("*")
			.eq("user_id", user_id)
			.eq("group_id", semillero_id)
			.eq("activity_type", "group")
			.single();

		// El usuario está inscrito si no hay error y hay datos en la respuesta
		const isUserEnrolled = !enrollmentError && enrollmentData != null;

		console.log(isUserEnrolled);

		const semilleroInfoArray = [
			{
				group_name,
				group_description,
				slots,
				available_slots,
				monday_start,
				monday_end,
				tuesday_start,
				tuesday_end,
				wednesday_start,
				wednesday_end,
				thursday_start,
				thursday_end,
				friday_start,
				friday_end,
				saturday_start,
				saturday_end,
				photo,
				place,
			},
		];

		// Enviar la respuesta con la información del semillero y si el usuario está inscrito
		res.status(200).json({
			message: "Semillero Sent",
			semilleroInfoArray,
			isUserEnrolled,
		});
	} catch (error) {
		console.error("Error: " + `${error}`);
		res.status(500).json({ error: `${error}` });
	}
}

async function getEventById(req, res) {
	try {
		const { event_id, user_id } = req.body;

		// Buscar si el semillero existe
		const { data: eventData, error: eventError } = await supabase
			.from("events")
			.select("*")
			.eq("event_id", event_id)
			.single();

		// Si el semillero no existe
		if (eventError) {
			throw new Error("Event does not exist");
		}

		// Obtener la información del semillero
		const {
			event_name,
			event_description,
			slots,
			available_slots,
			monday_start,
			monday_end,
			tuesday_start,
			tuesday_end,
			wednesday_start,
			wednesday_end,
			thursday_start,
			thursday_end,
			friday_start,
			friday_end,
			saturday_start,
			saturday_end,
			photo,
			place,
		} = eventData;

		// Verificar si el usuario está inscrito en el semillero
		const { data: enrollmentData, error: enrollmentError } = await supabase
			.from("enrollments")
			.select("*")
			.eq("user_id", user_id)
			.eq("event_id", event_id)
			.eq("activity_type", "event")
			.single();

		// El usuario está inscrito si no hay error y hay datos en la respuesta
		const isUserEnrolled = !enrollmentError && enrollmentData != null;

		const eventInfoArray = [
			{
				event_name,
				event_description,
				slots,
				available_slots,
				monday_start,
				monday_end,
				tuesday_start,
				tuesday_end,
				wednesday_start,
				wednesday_end,
				thursday_start,
				thursday_end,
				friday_start,
				friday_end,
				saturday_start,
				saturday_end,
				photo,
				place,
			},
		];

		// Enviar la respuesta con la información del semillero y si el usuario está inscrito
		res.status(200).json({
			message: "event Sent",
			eventInfoArray,
			isUserEnrolled,
		});
	} catch (error) {
		console.error("Error: " + `${error}`);
		res.status(500).json({ error: `${error}` });
	}
}

async function getActivities(req, res) {
	try {
		const { data: activities, error: activitiesError } = await supabase
			.from("groups")
			.select("group_id, group_name, group_description, photo");

		if (activitiesError) {
			res.status(500).json({ error: activitiesError });
			console.log(activitiesError);
		} else {
			console.log("Lista semilleros:", JSON.stringify(activities)); // Ver como cadena JSON en consola
			console.log("Semilleros: " + activities);

			res.status(200).json({ message: "sent", activities: activities });
		}
	} catch (error) {
		res.status(500).json({ error: `${error}` });
		console.log("Error: " + error);
	}
}

module.exports = {
	makeEnrollment,
	createNewActivity,
	enrolledActivities,
	getSemilleroById,
	getEvents,
	getActivities,
	getEventById,
	cancelEnrollment
};
