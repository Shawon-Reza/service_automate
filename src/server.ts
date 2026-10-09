import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { jobManager } from "./jobs/job.manager.js";

try {
  await prisma.$connect();
  await jobManager.failInterruptedJobs();

  const server = app.listen(env.port, "127.0.0.1", () => {
    console.log(`Android automation API listening at http://localhost:${env.port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      server.close((error) => {
        if (error) {
          console.error("Could not close the HTTP server cleanly.", error);
          process.exitCode = 1;
        }
        void prisma.$disconnect().catch((disconnectError: unknown) => {
          console.error("Could not disconnect from PostgreSQL cleanly.", disconnectError);
          process.exitCode = 1;
        });
      });
    });
  }
} catch (error) {
  console.error("Could not connect to PostgreSQL or recover interrupted jobs.", error);
  await prisma.$disconnect();
  process.exitCode = 1;
}
