// Importa los módulos necesarios y el controlador a probar
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UsersModel = require("../models/UsersModel");
const { loginUser, registerUser } = require("../controllers/authController");
const { insertUser } = require("../models/UsersModel");

// Mock de las funciones y objetos necesarios
jest.mock("../models/UsersModel", () => ({
	getUserByEmail: jest.fn(),
	insertUser: jest.fn(),
}));
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

// Crear un mock del objeto 'req' y 'res'
const req = {
	body: {},
};
let res; // Declaración de 'res' para configurar antes de cada prueba

// Configurar el entorno de prueba antes de cada prueba
beforeEach(() => {
	res = {
		json: jest.fn(),
		status: jest.fn(),
	};
});

const mockRequest = () => {
	return {
		body: {},
	};
};

const mockResponse = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

// Prueba registerUser
describe("registerUser", () => {
	it("debería responder con 'OK' en caso de registro exitoso", async () => {
		const name = "Test User";
		const email = "test@example.com";
		const password = "password123";
		const hashedPassword = "hashedPassword";

		req.body = { name, email, password };

		bcrypt.hash.mockResolvedValue(hashedPassword); // Simula el hashing de la contraseña
		insertUser.mockResolvedValue({}); // Simula la inserción del usuario

		await registerUser(req, res);

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).toHaveBeenCalledWith("OK");
	});

	it("debería responder con un error si las credenciales son inválidas", async () => {
		const req = mockRequest();
		req.body.email = "usuario@example.com";
		req.body.password = "contraseñaIncorrecta";

		const res = mockResponse();

		// Supongamos que aquí debes proporcionar una función mock para getUserByEmail
		const mockGetUserByEmail = jest.fn(() => ({
			user_id: 1,
			email: "usuario@example.com",
			password: "$2a$10$hashDeContraseña",
		}));

		const mockBcryptCompare = jest.fn(() => false);

		const originalGetUserByEmail = UsersModel.getUserByEmail;
		const originalBcryptCompare = bcrypt.compare;

		UsersModel.getUserByEmail = mockGetUserByEmail;
		bcrypt.compare = mockBcryptCompare;

		await loginUser(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({ error: "Credenciales de inicio de sesión inválidas" });

		// Restaura las funciones originales
		UsersModel.getUserByEmail = originalGetUserByEmail;
		bcrypt.compare = originalBcryptCompare;
	});
});
