import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
async function start() {
	try {
		const PORT = process.env.PORT || 3000;
		const app = await NestFactory.create(AppModule);
		app.useGlobalPipes(new ValidationPipe());
		app.setGlobalPrefix("api");
		await app.listen(PORT, () => {
			console.log("Server started on http://localhost:" + PORT);
		});
	} catch (error) {
		console.log(error);
	}
}
start();
