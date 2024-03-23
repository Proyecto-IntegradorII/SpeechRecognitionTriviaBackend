const authController = require("../controllers/authController"); // Reemplaza con la ubicación real de tu controlador
const { getUserByEmail } = require("../models/UsersModel"); // Asegúrate de importar las funciones necesarias
const bcrypt = require("bcryptjs");

// Mock de getUserByEmail para simular su comportamiento
jest.mock("../models/UsersModel", () => ({
	getUserByEmail: jest.fn(),
}));

describe("loginUser()", () => {
	it("debe devolver un error si las credenciales son inválidas", async () => {
		// Define un usuario de ejemplo y sus credenciales
		const user = {
			user_id: 1,
			email: "test@example.com",
			password: "hashed_password",
		};
		const email = "test@example.com";
		const password = "invalid_password";

		// Simula la función getUserByEmail para devolver el usuario de ejemplo
		getUserByEmail.mockResolvedValue(user);

		// Simula el comportamiento de bcrypt.compare para que devuelva false
		jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

		const req = {
			body: { email, password },
		};
		const res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(), // Mockea la función status para que devuelva el objeto res
		};

		await authController.loginUser(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Credenciales de inicio de sesión inválidas" });
	});

	it("debe devolver un error si las credenciales son inválidas", async () => {
		// Define un usuario de ejemplo y sus credenciales
		const user = {
			user_id: 1,
			email: "test@example.com",
			password: "hashed_password",
		};
		const email = "test@example.com";
		const password = "invalid_password";

		// Simula la función getUserByEmail para devolver el usuario de ejemplo
		getUserByEmail.mockResolvedValue(user);

		// Simula el comportamiento de bcrypt.compare para que devuelva false
		jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

		const req = {
			body: { email, password },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await authController.loginUser(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Credenciales de inicio de sesión inválidas" });
	});

	it("debe devolver un error si no se puede obtener el usuario", async () => {
		const email = "nonexistent@example.com";
		const password = "user_password";

		// Simula la función getUserByEmail para lanzar un error
		getUserByEmail.mockRejectedValue(new Error("Error obteniendo el usuario"));

		const req = {
			body: { email, password },
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		await authController.loginUser(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Credenciales de inicio de sesión inválidas" });
	});
});
