import express, { type Request, Response, NextFunction, Router } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';

// Criar duas instâncias separadas de Express
const app = express();
const apiRouter = Router();

// Configuração básica para ambos
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Configurar o log para as rotas de API
app.use((req, res, next) => {
  // Verificar se a rota começa com /api e imprimir informações para diagnóstico
  if (req.path.startsWith('/api')) {
    console.log(`[API Route] ${req.method} ${req.path} - Body:`, req.body);
  }

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Registrar as rotas da API em um roteador separado
  const server = await registerRoutes(app, apiRouter);

  // Montar o roteador da API antes de qualquer middleware do Vite
  app.use('/api', apiRouter);

  // Manipulação de erros
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Configurar Vite apenas após as rotas da API
  // Isso é importante para evitar que o Vite intercepte as rotas da API
  // com seu middleware catch-all
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  server.listen({
    port: PORT,
    host: HOST,
    reusePort: true,
  }, () => {
    log(`serving on ${HOST}:${PORT}`);
  });
})();