import 'reflect-metadata';
import 'dotenv/config';
import { SetupRegistry } from 'src/Common/DI/Registry';
import { createServer } from 'src/Infra/Http/Server';

const bootstrap = async () => {
    SetupRegistry();

    const port = process.env.PORT ?? 3000;
    const app = createServer();

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

bootstrap();